# YOU+ LiveKit Migration Guide

**Version**: 1.0
**Date**: 2025-12-19
**Migration Type**: Cartesia Line SDK (Phone Calls) → LiveKit Agents SDK (In-App Voice)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Changes](#architecture-changes)
3. [Prerequisites](#prerequisites)
4. [Phase 1: LiveKit Infrastructure Setup](#phase-1-livekit-infrastructure-setup)
5. [Phase 2: Backend Integration](#phase-2-backend-integration)
6. [Phase 3: iOS App Integration](#phase-3-ios-app-integration)
7. [Phase 4: Agent Deployment](#phase-4-agent-deployment)
8. [Phase 5: Call Scheduling Update](#phase-5-call-scheduling-update)
9. [Phase 6: Testing & Validation](#phase-6-testing--validation)
10. [Phase 7: Production Deployment](#phase-7-production-deployment)
11. [Rollback Plan](#rollback-plan)
12. [Troubleshooting](#troubleshooting)

---

## Overview

### What's Changing

**OLD Architecture (Cartesia Line)**:
```
AWS EventBridge → Lambda → Cartesia API → Phone Call → User's Phone
```

**NEW Architecture (LiveKit)**:
```
AWS EventBridge → Lambda → Backend API → LiveKit Room
                                              ↓
                                    iOS App (Push Notification)
                                              ↓
                                    LiveKit Room Connection
                                              ↓
                                    agent-livekit/ (Python Worker)
```

### Why Migrate?

| Feature | Cartesia Line | LiveKit |
|---------|--------------|---------|
| **Call Type** | Phone calls | In-app voice (WebRTC) |
| **Cost** | ~$0.06/min (phone) | ~$0.01/min (WebRTC) |
| **UX** | Interrupts user | In-app, user-initiated |
| **Control** | Limited | Full UI/UX control |
| **Features** | Voice only | Voice + potential video/screen |
| **Analytics** | Basic | Full WebRTC stats |
| **Latency** | Phone network | Internet (often lower) |

### What's NOT Changing

- ✅ Voice cloning via Cartesia (still used for TTS within LiveKit)
- ✅ Multi-agent system architecture
- ✅ Conversation logic (stages, moods, persona system)
- ✅ Background analyzers
- ✅ Supabase database schema
- ✅ Backend API structure (mostly)

---

## Architecture Changes

### Component Diagram

```
┌─────────────────┐
│   iOS App       │
│  (SwiftUI)      │
└────────┬────────┘
         │ LiveKit SDK
         ↓
┌─────────────────┐      ┌──────────────────┐
│ LiveKit Server  │◄────►│  Backend API     │
│  (Cloud/Self)   │      │  (Cloudflare)    │
└────────┬────────┘      └──────────────────┘
         │                        ▲
         ↓                        │
┌─────────────────┐              │
│  agent-livekit/ │              │
│  (Python Worker)│──────────────┘
└─────────────────┘       Supabase

┌──────────────────┐
│  AWS EventBridge │
│     + Lambda     │
└──────────────────┘
```

### Data Flow

**1. Daily Call Trigger**:
```
EventBridge Schedule
  → Lambda (validate user, check timezone)
  → Backend API: POST /api/calls/schedule-livekit
    → Create LiveKit room
    → Save call record to Supabase
    → Send push notification to iOS
```

**2. User Joins Call**:
```
iOS App receives notification
  → User taps to join
  → Backend API: POST /api/calls/livekit-token
    ← Returns LiveKit access token
  → iOS connects to LiveKit room
  → agent-livekit/ worker joins room
  → Voice conversation begins
```

**3. During Call**:
```
User speaks → Deepgram (STT) → agent-livekit/
                                     ↓
                               Background analysis
                                     ↓
                               Agent response (LLM)
                                     ↓
                               Cartesia TTS → User hears
```

**4. After Call**:
```
agent-livekit/ → Save analytics to Supabase
                → Update streaks, trust score
                → Trigger backend webhooks
```

---

## Prerequisites

### Accounts & Credentials

- [ ] **LiveKit Cloud Account** (or self-hosted server)
  - Sign up: https://cloud.livekit.io
  - Create a project
  - Get: API Key, API Secret, WebSocket URL

- [ ] **Existing Credentials** (should already have):
  - Supabase (URL, Service Key)
  - AWS (Access Key, Secret Key for EventBridge/Lambda)
  - Bedrock API Key (for LLM)
  - Deepgram API Key (STT)
  - Cartesia API Key (TTS/voice cloning)
  - Supermemory API Key (optional)

### Tools & SDKs

- [ ] **iOS Development**:
  - Xcode 15+
  - Swift 5.9+
  - CocoaPods or Swift Package Manager

- [ ] **Backend Development**:
  - Node.js 18+
  - TypeScript 5+
  - Wrangler CLI (Cloudflare)

- [ ] **Agent Development**:
  - Python 3.12+
  - uv (Python package manager)
  - LiveKit CLI (optional, for testing)

---

## Phase 1: LiveKit Infrastructure Setup

### Step 1.1: Set Up LiveKit Cloud

**Option A: LiveKit Cloud** (Recommended for MVP)

1. Go to https://cloud.livekit.io
2. Sign up and create a new project
3. Name: `youplus-production` (or `youplus-dev` for testing)
4. Note down credentials:
   ```
   LiveKit URL: wss://youplus-xxxxx.livekit.cloud
   API Key: APIxxxxxxxxxxxxxxxxx
   API Secret: secret_xxxxxxxxxxxxxxxxxxxxxx
   ```

**Option B: Self-Hosted** (For cost optimization later)

See: https://docs.livekit.io/home/self-hosting/deployment/

### Step 1.2: Configure LiveKit Webhooks

1. In LiveKit Cloud dashboard → Settings → Webhooks
2. Add webhook URL: `https://youplus-backend.workers.dev/webhook/livekit`
3. Select events:
   - `room_started`
   - `room_finished`
   - `participant_joined`
   - `participant_left`
4. Save webhook secret for verification

### Step 1.3: Test LiveKit Connection

```bash
# Install LiveKit CLI
brew install livekit-cli

# Test connection
livekit-cli create-token \
  --api-key APIxxxxxxxxxx \
  --api-secret secret_xxxxxx \
  --join --room test-room --identity test-user

# Should output a JWT token
```

---

## Phase 2: Backend Integration

### Step 2.1: Install LiveKit SDK

```bash
cd backend
npm install livekit-server-sdk
npm install --save-dev @types/node
```

### Step 2.2: Add Environment Variables

Edit `backend/.env` (and update in Cloudflare Workers dashboard):

```bash
# LiveKit Configuration
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=secret_xxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_URL=wss://youplus-xxxxx.livekit.cloud
LIVEKIT_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx

# Existing vars (keep these)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
BACKEND_URL=https://youplus-backend.workers.dev
# ... rest of existing vars
```

### Step 2.3: Create LiveKit Token Endpoint

Create `backend/src/features/livekit/router.ts`:

```typescript
import { Hono } from "hono";
import { AccessToken } from "livekit-server-sdk";
import { supabaseAdmin } from "@/services/supabase";
import { authMiddleware } from "@/middleware/auth";

const app = new Hono<{ Bindings: Env }>();

/**
 * POST /api/livekit/token
 * Generate LiveKit access token for authenticated user
 */
app.post("/token", authMiddleware, async (c) => {
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Fetch user context
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, phone, future_self(cartesia_voice_id)")
    .eq("id", userId)
    .single();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const voiceId = user.future_self?.cartesia_voice_id;
  const roomName = `call-${userId}-${Date.now()}`;

  // Create LiveKit token
  const at = new AccessToken(
    c.env.LIVEKIT_API_KEY,
    c.env.LIVEKIT_API_SECRET,
    {
      identity: userId,
      name: user.phone || userId,
      metadata: JSON.stringify({
        user_id: userId,
        voice_id: voiceId,
        call_type: "daily_accountability",
      }),
    }
  );

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();

  return c.json({
    token,
    url: c.env.LIVEKIT_URL,
    roomName,
  });
});

/**
 * POST /api/livekit/schedule-call
 * Create a LiveKit room for scheduled call (called by Lambda)
 */
app.post("/schedule-call", async (c) => {
  const body = await c.req.json<{ user_id: string }>();
  const { user_id } = body;

  if (!user_id) {
    return c.json({ error: "user_id required" }, 400);
  }

  // Fetch user context
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, phone, future_self(cartesia_voice_id)")
    .eq("id", user_id)
    .single();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const roomName = `call-${user_id}-${Date.now()}`;
  const voiceId = user.future_self?.cartesia_voice_id;

  // Save call record
  const { data: callRecord } = await supabaseAdmin
    .from("call_analytics")
    .insert({
      user_id,
      call_type: "daily_accountability",
      status: "scheduled",
      room_name: roomName,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  // TODO: Send push notification to iOS app
  // This will be implemented in Phase 3

  return c.json({
    success: true,
    room_name: roomName,
    call_id: callRecord?.id,
  });
});

export default app;
```

### Step 2.4: Add LiveKit Routes to Main Router

Edit `backend/src/index.ts`:

```typescript
import livekitRouter from "@/features/livekit/router";

// ... existing imports

app.route("/api/livekit", livekitRouter);
```

### Step 2.5: Update Webhook Handler

Create `backend/src/features/webhook/handlers/livekit-webhooks.ts`:

```typescript
import { Hono } from "hono";
import { WebhookReceiver } from "livekit-server-sdk";
import { supabaseAdmin } from "@/services/supabase";

const app = new Hono<{ Bindings: Env }>();

/**
 * POST /webhook/livekit
 * Handle LiveKit room events
 */
app.post("/livekit", async (c) => {
  const webhookSecret = c.env.LIVEKIT_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("LIVEKIT_WEBHOOK_SECRET not configured");
    return c.json({ error: "Webhook not configured" }, 500);
  }

  const body = await c.req.text();
  const authHeader = c.req.header("Authorization");

  const receiver = new WebhookReceiver(
    c.env.LIVEKIT_API_KEY,
    webhookSecret
  );

  try {
    const event = await receiver.receive(body, authHeader || "");

    console.log("LiveKit webhook event:", event.event);

    switch (event.event) {
      case "room_started":
        await handleRoomStarted(event);
        break;
      case "room_finished":
        await handleRoomFinished(event);
        break;
      case "participant_joined":
        await handleParticipantJoined(event);
        break;
      case "participant_left":
        await handleParticipantLeft(event);
        break;
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return c.json({ error: "Invalid webhook" }, 401);
  }
});

async function handleRoomStarted(event: any) {
  const roomName = event.room?.name;
  console.log(`Room started: ${roomName}`);

  // Update call_analytics status
  await supabaseAdmin
    .from("call_analytics")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("room_name", roomName);
}

async function handleRoomFinished(event: any) {
  const roomName = event.room?.name;
  console.log(`Room finished: ${roomName}`);

  // Update call_analytics status
  await supabaseAdmin
    .from("call_analytics")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("room_name", roomName);
}

async function handleParticipantJoined(event: any) {
  const { identity, name } = event.participant || {};
  console.log(`Participant joined: ${identity} (${name})`);
}

async function handleParticipantLeft(event: any) {
  const { identity } = event.participant || {};
  console.log(`Participant left: ${identity}`);
}

export default app;
```

Add to webhook router:

```typescript
// backend/src/features/webhook/router.ts
import livekitWebhooks from "./handlers/livekit-webhooks";

app.route("/livekit", livekitWebhooks);
```

### Step 2.6: Deploy Backend Changes

```bash
cd backend
npm run build
npm run deploy

# Verify deployment
curl https://youplus-backend.workers.dev/webhook/livekit/health
```

---

## Phase 3: iOS App Integration

### Step 3.1: Add LiveKit SDK to Xcode

**Option A: Swift Package Manager** (Recommended)

1. Open `youplus.xcodeproj` in Xcode
2. File → Add Packages...
3. Enter URL: `https://github.com/livekit/client-sdk-swift`
4. Select version: `2.0.0` or later
5. Add to target: `youplus`

**Option B: CocoaPods**

```ruby
# Podfile
pod 'LiveKit', '~> 2.0'
```

### Step 3.2: Create LiveKitVoiceService

Create `youplus/youplus/Core/Services/LiveKitVoiceService.swift`:

```swift
import Foundation
import LiveKit
import AVFoundation
import Combine

/// Manages LiveKit connection for real-time voice calls with Future Self
@MainActor
class LiveKitVoiceService: NSObject, ObservableObject {
    // MARK: - Published Properties
    @Published var isConnected = false
    @Published var isCallActive = false
    @Published var errorMessage: String?
    @Published var callDuration: TimeInterval = 0

    // MARK: - Private Properties
    private var room: Room?
    private var durationTimer: Timer?
    private let apiClient = APIClient.shared
    private let callKitManager = CallKitManager.shared

    // MARK: - Public Methods

    /// Connect to LiveKit room and begin voice call
    func connect(userId: String) async throws {
        print("DEBUG: Connecting to LiveKit for userId=\(userId)")

        // 1. Start CallKit call
        try await callKitManager.startCall(userId: userId, displayName: "Future You")

        // 2. Get LiveKit token from backend
        let tokenData = try await fetchLiveKitToken()

        // 3. Configure audio session
        try configureAudioSession()

        // 4. Connect to LiveKit room
        let roomOptions = RoomOptions(
            defaultCameraCaptureOptions: CameraCaptureOptions(
                dimensions: .h1080_169
            ),
            defaultAudioCaptureOptions: AudioCaptureOptions(
                echoCancellation: true,
                noiseSuppression: true
            ),
            adaptiveStream: true,
            dynacast: true
        )

        room = Room(delegate: self)

        try await room?.connect(
            url: tokenData.url,
            token: tokenData.token,
            roomOptions: roomOptions
        )

        // 5. Enable microphone
        try await room?.localParticipant.setMicrophone(enabled: true)

        isConnected = true
        isCallActive = true
        startDurationTimer()

        print("✅ Connected to LiveKit room: \(tokenData.roomName)")
    }

    /// Disconnect from LiveKit room
    func disconnect() async {
        print("DEBUG: Disconnecting from LiveKit")

        durationTimer?.invalidate()
        durationTimer = nil

        await room?.disconnect()
        room = nil

        isConnected = false
        isCallActive = false
        callDuration = 0

        await callKitManager.endCall()

        print("✅ Disconnected from LiveKit")
    }

    // MARK: - Private Methods

    private func fetchLiveKitToken() async throws -> LiveKitTokenResponse {
        let endpoint = "/api/livekit/token"

        guard let response: LiveKitTokenResponse = try await apiClient.request(
            endpoint: endpoint,
            method: "POST"
        ) else {
            throw LiveKitError.tokenFetchFailed
        }

        return response
    }

    private func configureAudioSession() throws {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(
            .playAndRecord,
            mode: .voiceChat,
            options: [.allowBluetooth, .defaultToSpeaker]
        )
        try audioSession.setActive(true)
    }

    private func startDurationTimer() {
        callDuration = 0
        durationTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.callDuration += 1
            }
        }
    }
}

// MARK: - RoomDelegate
extension LiveKitVoiceService: RoomDelegate {
    nonisolated func room(_ room: Room, didUpdate connectionState: ConnectionState, from oldValue: ConnectionState) {
        Task { @MainActor in
            print("LiveKit connection state: \(connectionState)")

            switch connectionState {
            case .connected:
                isConnected = true
            case .disconnected:
                isConnected = false
                isCallActive = false
            case .reconnecting:
                print("⚠️ Reconnecting to LiveKit...")
            default:
                break
            }
        }
    }

    nonisolated func room(_ room: Room, participant: RemoteParticipant, didSubscribe track: Track, publication: TrackPublication) {
        Task { @MainActor in
            print("✅ Subscribed to track: \(track.kind)")

            if let audioTrack = track as? RemoteAudioTrack {
                // Agent audio track - automatically played
                print("🎧 Agent audio track subscribed")
            }
        }
    }

    nonisolated func room(_ room: Room, participant: RemoteParticipant, didUnsubscribe track: Track, publication: TrackPublication) {
        print("Track unsubscribed: \(track.kind)")
    }

    nonisolated func room(_ room: Room, didUpdate room: Room) {
        // Room metadata updated
    }
}

// MARK: - Models
struct LiveKitTokenResponse: Codable {
    let token: String
    let url: String
    let roomName: String
}

enum LiveKitError: LocalizedError {
    case tokenFetchFailed
    case connectionFailed

    var errorDescription: String? {
        switch self {
        case .tokenFetchFailed:
            return "Failed to fetch LiveKit access token"
        case .connectionFailed:
            return "Failed to connect to LiveKit room"
        }
    }
}
```

### Step 3.3: Update CallViewModel

Edit `youplus/youplus/Features/Call/CallViewModel.swift`:

```swift
import Foundation
import Combine

@MainActor
class CallViewModel: ObservableObject {
    @Published var isCallActive = false
    @Published var callDuration: TimeInterval = 0
    @Published var errorMessage: String?
    @Published var isConnecting = false

    // Replace WebSocketVoiceService with LiveKitVoiceService
    private let voiceService = LiveKitVoiceService()
    private var cancellables = Set<AnyCancellable>()

    init() {
        // Observe voice service state
        voiceService.$isCallActive
            .assign(to: &$isCallActive)

        voiceService.$callDuration
            .assign(to: &$callDuration)

        voiceService.$errorMessage
            .assign(to: &$errorMessage)
    }

    func startCall(userId: String) async {
        isConnecting = true
        errorMessage = nil

        do {
            try await voiceService.connect(userId: userId)
            isConnecting = false
        } catch {
            isConnecting = false
            errorMessage = error.localizedDescription
            print("❌ Call failed: \(error)")
        }
    }

    func endCall() async {
        await voiceService.disconnect()
    }
}
```

### Step 3.4: Update CallView UI

Edit `youplus/youplus/Features/Call/CallView.swift`:

```swift
// Update the "Start Call" button action
Button("Start Call") {
    Task {
        await viewModel.startCall(userId: authManager.currentUserId ?? "")
    }
}
.brutalist(
    isPrimary: true,
    isLoading: viewModel.isConnecting
)

// Update end call button
if viewModel.isCallActive {
    Button("End Call") {
        Task {
            await viewModel.endCall()
        }
    }
    .brutalist(color: .red)
}
```

### Step 3.5: Update Info.plist Permissions

Ensure these are present in `youplus/youplus/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone for voice calls with your Future Self</string>
<key>NSLocalNetworkUsageDescription</key>
<string>We need local network access for voice calls</string>
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>voip</string>
</array>
```

### Step 3.6: Build and Test iOS App

```bash
# Clean build folder
rm -rf ~/Library/Developer/Xcode/DerivedData

# Open in Xcode
open youplus/youplus.xcodeproj

# Build and run (Cmd+R)
```

---

## Phase 4: Agent Deployment

### Step 4.1: Configure Environment

Create `agent-livekit/.env`:

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://youplus-xxxxx.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=secret_xxxxxxxxxxxxxxxxxxxxxx

# LLM & Speech Services
BEDROCK_API_KEY=your_bedrock_key
DEEPGRAM_API_KEY=your_deepgram_key
CARTESIA_API_KEY=your_cartesia_key

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...

# Optional
SUPERMEMORY_API_KEY=your_supermemory_key (optional)
BACKEND_URL=https://youplus-backend.workers.dev
```

### Step 4.2: Install Dependencies

```bash
cd agent-livekit

# Create virtual environment
python3.12 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 4.3: Test Locally

```bash
# Run in development mode
python main.py dev

# Should see:
# INFO: Starting Future Self Agent (LiveKit)...
# INFO: Environment validation passed
# INFO: Prewarming: Loading VAD model...
# INFO: Worker ready, waiting for jobs...
```

### Step 4.4: Deploy to Production

**Option A: Railway** (Recommended)

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Create project: `railway init`
4. Add environment variables:
   ```bash
   railway variables set LIVEKIT_URL=wss://...
   railway variables set LIVEKIT_API_KEY=...
   railway variables set LIVEKIT_API_SECRET=...
   # ... add all vars from .env
   ```
5. Deploy:
   ```bash
   railway up
   ```

**Option B: Fly.io**

1. Install Fly CLI: `brew install flyctl`
2. Login: `fly auth login`
3. Create `fly.toml`:
   ```toml
   app = "youplus-agent"

   [build]
     builder = "paketobuildpacks/builder:base"

   [[services]]
     internal_port = 8080
     protocol = "tcp"

     [[services.ports]]
       port = 443
   ```
4. Set secrets:
   ```bash
   fly secrets set LIVEKIT_URL=wss://...
   fly secrets set LIVEKIT_API_KEY=...
   # ... add all secrets
   ```
5. Deploy:
   ```bash
   fly deploy
   ```

**Option C: Docker + Self-Hosted**

```dockerfile
# agent-livekit/Dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py", "start"]
```

Build and run:
```bash
docker build -t youplus-agent .
docker run -d \
  -e LIVEKIT_URL=wss://... \
  -e LIVEKIT_API_KEY=... \
  -e LIVEKIT_API_SECRET=... \
  # ... add all environment variables \
  --name youplus-agent \
  youplus-agent
```

---

## Phase 5: Call Scheduling Update

### Step 5.1: Update Lambda Handler

Edit `lambda/daily-call-trigger/index.js`:

```javascript
// Replace Cartesia call trigger with LiveKit room creation

const https = require('https');

exports.handler = async (event) => {
  console.log('Daily call trigger event:', JSON.stringify(event, null, 2));

  const userId = event.detail.userId; // From EventBridge event

  if (!userId) {
    console.error('No userId in event');
    return { statusCode: 400, body: 'No userId' };
  }

  // Call backend to create LiveKit room
  const backendUrl = process.env.BACKEND_URL;

  try {
    const response = await fetch(`${backendUrl}/api/livekit/schedule-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.BACKEND_API_KEY, // Add auth
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend error:', data);
      return { statusCode: 500, body: 'Backend error' };
    }

    console.log('LiveKit room created:', data.room_name);

    // TODO: Send push notification to iOS app
    // Implementation depends on your notification service (APNs, Firebase, etc.)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        roomName: data.room_name,
      }),
    };
  } catch (error) {
    console.error('Lambda error:', error);
    return { statusCode: 500, body: error.message };
  }
};
```

### Step 5.2: Update Lambda Environment Variables

```bash
# Add to Lambda function configuration
BACKEND_URL=https://youplus-backend.workers.dev
BACKEND_API_KEY=your_backend_api_key
```

### Step 5.3: Deploy Lambda

```bash
cd lambda/daily-call-trigger
zip -r function.zip .
aws lambda update-function-code \
  --function-name youplus-daily-call-trigger \
  --zip-file fileb://function.zip
```

---

## Phase 6: Testing & Validation

### Step 6.1: Unit Tests

**Backend Token Generation**:
```bash
cd backend
npm test -- livekit
```

**Agent Local Test**:
```bash
cd agent-livekit
python -m pytest tests/
```

### Step 6.2: Integration Tests

**Test 1: Token Generation**
```bash
# Get auth token first (login via iOS app or web)
export AUTH_TOKEN="your_auth_token"

# Request LiveKit token
curl -X POST https://youplus-backend.workers.dev/api/livekit/token \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json"

# Should return:
# {
#   "token": "eyJhbGc...",
#   "url": "wss://youplus-xxxxx.livekit.cloud",
#   "roomName": "call-user_id-1234567890"
# }
```

**Test 2: Room Creation**
```bash
curl -X POST https://youplus-backend.workers.dev/api/livekit/schedule-call \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_id"}'

# Should return:
# {
#   "success": true,
#   "room_name": "call-test_user_id-1234567890",
#   "call_id": "uuid"
# }
```

**Test 3: iOS Connection**
1. Build and run iOS app in Xcode
2. Login with test account
3. Navigate to Call screen
4. Tap "Start Call"
5. Verify:
   - CallKit call appears
   - LiveKit connection established
   - Agent joins room (check LiveKit dashboard)
   - Voice conversation works

**Test 4: Agent Functionality**
1. Start a call via iOS app
2. Speak: "Hi, Future Self"
3. Verify agent responds appropriately
4. Test background analyzers:
   - Say an excuse: "I was too tired" → Should detect
   - Commit to action: "I'll wake up at 6am tomorrow" → Should extract
5. End call
6. Check Supabase `call_analytics` table for saved data

### Step 6.3: Load Testing

```bash
# Use LiveKit load testing tool
livekit-load-test \
  --url wss://youplus-xxxxx.livekit.cloud \
  --api-key APIxxxxxxxxxx \
  --api-secret secret_xxxxxx \
  --room test-room \
  --publishers 1 \
  --subscribers 10 \
  --duration 60s
```

---

## Phase 7: Production Deployment

### Step 7.1: Pre-Deployment Checklist

- [ ] All environment variables set in production
- [ ] LiveKit Cloud project configured for production
- [ ] Backend deployed with LiveKit routes
- [ ] iOS app built with LiveKit SDK
- [ ] Agent deployed to production server
- [ ] Lambda updated with new scheduling logic
- [ ] Database migrations applied (if any)
- [ ] Monitoring and logging configured

### Step 7.2: Deployment Sequence

**1. Deploy Backend** (Cloudflare Workers)
```bash
cd backend
npm run deploy
```

**2. Deploy Agent** (Railway/Fly.io)
```bash
cd agent-livekit
railway up  # or fly deploy
```

**3. Update Lambda**
```bash
cd lambda/daily-call-trigger
./deploy.sh
```

**4. Deploy iOS App**
- Build for release in Xcode
- Archive and upload to App Store Connect
- Submit for TestFlight beta testing first

### Step 7.3: Gradual Rollout Plan

**Week 1: Internal Testing**
- Deploy to staging environment
- Test with internal team accounts only
- Monitor LiveKit dashboard for issues

**Week 2: Beta Testing**
- Enable for 10-20 beta users via feature flag
- Monitor error rates and feedback
- Iterate on issues

**Week 3: Gradual Rollout**
- 10% of users
- 25% of users
- 50% of users
- 100% of users (if no critical issues)

### Step 7.4: Feature Flag Implementation

Add to backend:

```typescript
// backend/src/services/feature-flags.ts
export async function isLiveKitEnabled(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("feature_flags")
    .eq("id", userId)
    .single();

  return data?.feature_flags?.livekit_enabled === true;
}
```

Use in Lambda:
```javascript
const livekitEnabled = await checkFeatureFlag(userId, 'livekit_enabled');

if (livekitEnabled) {
  // Use LiveKit (new)
  await scheduleLiveKitCall(userId);
} else {
  // Use Cartesia Line (old)
  await scheduleCartesiaCall(userId);
}
```

---

## Rollback Plan

### If Critical Issues Arise

**Immediate Rollback** (< 5 minutes):

1. **Backend**: Revert to previous deployment
   ```bash
   cd backend
   wrangler rollback
   ```

2. **Lambda**: Revert to previous version
   ```bash
   aws lambda update-function-code \
     --function-name youplus-daily-call-trigger \
     --s3-bucket your-lambda-backup \
     --s3-key previous-version.zip
   ```

3. **iOS App**:
   - Cannot rollback deployed app
   - Use feature flag to disable LiveKit
   - Emergency update via TestFlight

4. **Agent**: Keep both agents running
   - Cartesia Line agent (old) stays running
   - LiveKit agent can be stopped if needed

### Database Rollback

```sql
-- If new columns were added, they can stay (no-op)
-- If data migration occurred, run reverse migration
```

---

## Troubleshooting

### Common Issues

#### 1. iOS App Cannot Connect to LiveKit

**Symptoms**: "Connection failed" error in iOS app

**Checks**:
- [ ] Verify LiveKit URL is correct (wss://...)
- [ ] Check token is not expired (tokens last 1 hour by default)
- [ ] Verify network connectivity
- [ ] Check LiveKit dashboard for room creation
- [ ] Ensure microphone permissions granted

**Solution**:
```swift
// Add detailed logging in LiveKitVoiceService
print("LiveKit URL: \(tokenData.url)")
print("Token: \(String(tokenData.token.prefix(20)))...")
print("Room: \(tokenData.roomName)")
```

#### 2. Agent Not Joining Room

**Symptoms**: User connects but agent doesn't respond

**Checks**:
- [ ] Agent service is running (`railway status` or check logs)
- [ ] Agent environment variables are set correctly
- [ ] Agent has network access to LiveKit server
- [ ] Room name matches between iOS and agent

**Solution**:
```bash
# Check agent logs
railway logs
# or
fly logs

# Look for: "Job started: room=..." and "Participant joined: ..."
```

#### 3. No Audio from Agent

**Symptoms**: Connection works but can't hear agent voice

**Checks**:
- [ ] Cartesia TTS voice ID is valid
- [ ] Deepgram API key is working
- [ ] Audio track is subscribed in iOS app
- [ ] iOS audio session is configured correctly

**Solution**:
```swift
// Check if audio track is received
nonisolated func room(_ room: Room, participant: RemoteParticipant, didSubscribe track: Track, publication: TrackPublication) {
    if let audioTrack = track as? RemoteAudioTrack {
        print("✅ Audio track subscribed: \(audioTrack.sid)")
        print("Audio track enabled: \(audioTrack.isEnabled)")
    }
}
```

#### 4. High Latency / Poor Audio Quality

**Symptoms**: Delayed responses, choppy audio

**Checks**:
- [ ] Network quality (use LiveKit dashboard to check stats)
- [ ] Agent server location (should be geographically close)
- [ ] Deepgram model (try `nova-2` for lower latency)
- [ ] Cartesia TTS speed settings

**Solution**:
```python
# agent-livekit/core/handlers/session.py
# Use faster STT model
stt = deepgram.STT(
    model="nova-2-conversationalai",  # Optimized for low latency
    language="en",
)

# Adjust TTS speed
tts = cartesia.TTS(
    voice=voice_id,
    model="sonic-english",
    speed=1.1,  # Slightly faster
)
```

#### 5. Background Analyzers Not Working

**Symptoms**: Agent responds but no excuse detection, etc.

**Checks**:
- [ ] Bedrock API key is valid
- [ ] Background analysis function is called
- [ ] Insights are being received by agent

**Solution**:
```python
# Add debug logging in agents/analyzers.py
async def run_background_analysis(...):
    print(f"Running analysis on: {user_text[:50]}...")
    insights = await asyncio.gather(*tasks, return_exceptions=True)
    print(f"Analysis results: {len(insights)} insights")
    for insight in insights:
        print(f"Insight: {type(insight).__name__}")
    return insights
```

---

## Success Metrics

### Technical Metrics

- [ ] **Connection Success Rate**: > 95%
- [ ] **Call Completion Rate**: > 90%
- [ ] **Average Latency**: < 500ms (STT + LLM + TTS)
- [ ] **Audio Quality**: MOS score > 4.0
- [ ] **Error Rate**: < 5%

### Business Metrics

- [ ] **Cost per Call**: < $0.02 (target: 70% reduction from Cartesia Line)
- [ ] **User Satisfaction**: > 4.5/5 stars
- [ ] **Call Duration**: Average 3-5 minutes (same as before)
- [ ] **Retention**: Same or better than Cartesia Line

### Monitoring Dashboard

Set up monitoring for:
- LiveKit room creation/join success rates
- Agent response times
- API error rates
- Database query performance
- iOS app crash rates

---

## Next Steps After Migration

1. **Remove Cartesia Line Code** (after 2 weeks of stable LiveKit)
   - Delete `agent/` directory
   - Remove Cartesia Line dependencies
   - Clean up old Lambda handlers

2. **Cost Optimization**
   - Self-host LiveKit server if scaling
   - Optimize LLM usage (caching, smaller models)
   - Monitor Deepgram usage

3. **Feature Enhancements**
   - Add video call option
   - Screen sharing for goal visualization
   - Real-time transcription display in UI
   - Voice activity indicators

4. **Analytics Improvements**
   - WebRTC quality metrics
   - Conversation flow analysis
   - A/B test different agent behaviors

---

## Support & Resources

### Documentation

- **LiveKit Docs**: https://docs.livekit.io
- **LiveKit Swift SDK**: https://github.com/livekit/client-sdk-swift
- **LiveKit Agents**: https://docs.livekit.io/agents/
- **Deepgram Docs**: https://developers.deepgram.com
- **Cartesia Docs**: https://docs.cartesia.ai

### Community

- **LiveKit Discord**: https://livekit.io/discord
- **LiveKit GitHub**: https://github.com/livekit

### Contact

- **Internal Team**: #youplus-engineering Slack channel
- **LiveKit Support**: support@livekit.io
- **Emergency Rollback**: Follow rollback plan above

---

**Migration Guide Version**: 1.0
**Last Updated**: 2025-12-19
**Status**: Ready for Implementation
