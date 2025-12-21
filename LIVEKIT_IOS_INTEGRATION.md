# LiveKit iOS Integration Guide for YOU+

## Overview
This guide shows how to integrate the LiveKit Swift SDK into your iOS app to connect users to voice calls with the Future Self agent.

## 1. Add LiveKit SDK to iOS App

### Install via SPM (Swift Package Manager)

1. Open `youplus.xcodeproj` in Xcode
2. Go to **File → Add Package Dependencies**
3. Enter: `https://github.com/livekit/client-sdk-swift`
4. Select version: **Latest**
5. Add to target: `youplus`

### Or add to `Package.swift`:
```swift
dependencies: [
    .package(url: "https://github.com/livekit/client-sdk-swift", from: "2.0.0")
]
```

## 2. Create LiveKit Service

Create `youplus/Core/Services/LiveKitService.swift`:

```swift
import LiveKit
import SwiftUI

@MainActor
class LiveKitService: ObservableObject {
    private var room: Room?

    @Published var isConnected = false
    @Published var isSpeaking = false

    // Connect to LiveKit room for voice call
    func connectToCall(
        userId: String,
        livekitUrl: String,
        livekitToken: String
    ) async throws {
        // Create room
        let room = Room()
        self.room = room

        // Set up listeners
        room.add(delegate: self)

        // Connect
        try await room.connect(
            url: livekitUrl,
            token: livekitToken
        )

        isConnected = true

        // Enable microphone
        let localParticipant = room.localParticipant
        try await localParticipant.setMicrophone(enabled: true)
    }

    func disconnect() async {
        await room?.disconnect()
        isConnected = false
    }

    func toggleMicrophone() async throws {
        guard let participant = room?.localParticipant else { return }
        let currentState = participant.isMicrophoneEnabled()
        try await participant.setMicrophone(enabled: !currentState)
    }
}

// MARK: - Room Delegate
extension LiveKitService: RoomDelegate {
    nonisolated func room(_ room: Room, participant: RemoteParticipant?, didReceive data: Data) {
        // Handle data from agent
    }

    nonisolated func room(_ room: Room, participant: Participant, didUpdate publication: TrackPublication, muted: Bool) {
        Task { @MainActor in
            isSpeaking = !muted
        }
    }

    nonisolated func room(_ room: Room, didUpdate connectionState: ConnectionState, from oldValue: ConnectionState) {
        Task { @MainActor in
            isConnected = (connectionState == .connected)
        }
    }
}
```

## 3. Get LiveKit Token from Backend

Your backend needs to generate LiveKit access tokens:

### Add to `backend/src/features/calls/start-call.ts`:

```typescript
import { AccessToken } from 'livekit-server-sdk';

export async function generateLivekitToken(userId: string): Promise<string> {
  const token = new AccessToken(
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
    {
      identity: userId,
      metadata: JSON.stringify({ user_id: userId }),
    }
  );

  // Grant permissions
  token.addGrant({
    room: `call-${userId}`,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return await token.toJwt();
}
```

### API Endpoint:
```typescript
// POST /api/calls/start
router.post('/start', authMiddleware, async (c) => {
  const userId = c.get('userId');

  // 1. Generate LiveKit token
  const livekitToken = await generateLivekitToken(userId);

  // 2. Return connection details
  return c.json({
    livekit_url: env.LIVEKIT_URL,
    livekit_token: livekitToken,
    room_name: `call-${userId}`,
  });
});
```

## 4. Update iOS Call Flow

### Modify `youplus/Features/Dashboard/DashboardView.swift`:

```swift
@StateObject private var livekitService = LiveKitService()
@State private var isInCall = false

var body: some View {
    VStack {
        // ... existing UI ...

        if isInCall {
            CallView(
                livekitService: livekitService,
                onEndCall: {
                    Task {
                        await livekitService.disconnect()
                        isInCall = false
                    }
                }
            )
        } else {
            Button("Start Call with Future Self") {
                Task {
                    await startCall()
                }
            }
        }
    }
}

private func startCall() async {
    do {
        // 1. Get LiveKit token from backend
        let response = try await APIClient.shared.post(
            "/api/calls/start",
            body: [:]
        )

        guard let livekitUrl = response["livekit_url"] as? String,
              let livekitToken = response["livekit_token"] as? String,
              let userId = response["user_id"] as? String else {
            throw APIError.invalidResponse
        }

        // 2. Connect to LiveKit
        try await livekitService.connectToCall(
            userId: userId,
            livekitUrl: livekitUrl,
            livekitToken: livekitToken
        )

        isInCall = true

    } catch {
        print("Failed to start call: \(error)")
    }
}
```

## 5. Create Call UI View

Create `youplus/Features/Call/CallView.swift`:

```swift
import SwiftUI

struct CallView: View {
    @ObservedObject var livekitService: LiveKitService
    let onEndCall: () -> Void

    var body: some View {
        ZStack {
            // Background
            AppTheme.blackAbsolute.ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()

                // Call status
                Text(livekitService.isConnected ? "Connected to Future Self" : "Connecting...")
                    .font(AppTheme.Typography.h2)
                    .foregroundColor(AppTheme.whiteSoft)

                // Visual indicator
                Circle()
                    .fill(livekitService.isSpeaking ? AppTheme.darkOrange : .gray)
                    .frame(width: 120, height: 120)
                    .animation(.easeInOut, value: livekitService.isSpeaking)

                Spacer()

                // Controls
                HStack(spacing: 60) {
                    // Mute button
                    Button {
                        Task {
                            try? await livekitService.toggleMicrophone()
                        }
                    } label: {
                        Image(systemName: "mic.slash.fill")
                            .font(.system(size: 30))
                            .foregroundColor(AppTheme.whiteSoft)
                    }

                    // End call button
                    Button {
                        onEndCall()
                    } label: {
                        Image(systemName: "phone.down.fill")
                            .font(.system(size: 30))
                            .foregroundColor(.red)
                    }
                }
                .padding(.bottom, 60)
            }
        }
    }
}
```

## 6. Testing Without Payments

### Skip Paywall for Testing:

In `youplus/ContentView.swift`, add a debug flag:

```swift
#if DEBUG
let skipPaywall = true  // Set to true for testing
#else
let skipPaywall = false
#endif

var body: some View {
    if !onboardingCompleted {
        OnboardingView()
    } else if !subscriptionActive && !skipPaywall {
        PaywallView()
    } else if !onboardingPushed {
        SetupProcessingView()
    } else {
        DashboardView()
    }
}
```

## 7. Test on Real iPhone

### Build for Device:
1. Connect iPhone via USB
2. Select your iPhone as target in Xcode
3. Press **Cmd+R** to build and run
4. Grant microphone permissions when prompted

### Test Flow:
1. Open app on iPhone
2. Complete onboarding (skip paywall in debug mode)
3. Tap "Start Call with Future Self"
4. Speak to your Future Self!
5. The agent should respond through LiveKit

## 8. Debugging

### Check Agent Logs:
```bash
cd agent-livekit
python main.py dev  # Run locally for testing
```

### Check iOS Logs in Xcode:
- **View → Debug Area → Show Debug Area**
- Look for LiveKit connection logs

### Common Issues:
1. **"Connection refused"** → Check LIVEKIT_URL is correct
2. **"Unauthorized"** → Check backend is generating valid tokens
3. **"No audio"** → Check microphone permissions in iOS Settings

## Production Checklist
- [ ] LiveKit Cloud project created
- [ ] Backend generating LiveKit tokens
- [ ] iOS app has LiveKit SDK installed
- [ ] Microphone permissions requested
- [ ] Agent deployed and running
- [ ] Test call works end-to-end
