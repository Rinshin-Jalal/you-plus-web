# Network Troubleshooting Guide

## Current Status
The iOS app's authentication flow is implemented correctly, but users are experiencing network connectivity issues when trying to sign in through the Supabase backend.

### Error Observed
```
nw_connection_copy_connected_local_endpoint_block_invoke [C1] Connection has no local endpoint
```

This error indicates that the iOS simulator (or device) cannot establish a network connection to the Supabase backend.

## Supabase Configuration
- **URL**: `https://mpicqllpqtwfafqppwal.supabase.co`
- **Configuration Location**: `youplus/Core/Auth/SupabaseConfig.swift`
- **Auth Manager**: `youplus/Core/Auth/AuthManager.swift`

## Troubleshooting Steps

### 1. Verify Supabase Backend is Running
First, test if the Supabase backend is accessible from your development machine:

```bash
# Test direct connectivity
curl -I https://mpicqllpqtwfafqppwal.supabase.co

# Test with authentication header
curl -H "apikey: YOUR_ANON_KEY" https://mpicqllpqtwfafqppwal.supabase.co/auth/v1/user
```

Expected: You should get a response (even if it's a 401 or other error - the important part is getting a response, not a connection timeout).

### 2. Simulator Networking Configuration

#### For iOS Simulator
The simulator has special networking rules. To allow the simulator to reach localhost services:

**Option A: Use a real device for testing**
- Build and run on an actual iPhone/iPad connected via Xcode
- This bypasses simulator networking quirks entirely

**Option B: Modify simulator network settings**
1. In Xcode, select the simulator and go to **Device → Network Settings**
2. Ensure the simulator can access the same network as your Mac

**Option C: Check if Supabase is behind a firewall**
- Verify that port 443 (HTTPS) is accessible from your network
- Check if your network/firewall blocks Supabase's IP ranges

### 3. Verify Authentication Credentials

The Supabase credentials are stored in `SupabaseConfig.swift`:
- The URL and API key are correctly configured
- If these were incorrect, you'd see a different error (typically a 401 or 403)

### 4. Enhanced Debug Logging

Recent improvements to `AuthManager.swift` now include detailed debug logging:

**Signs of Progress in Console:**
- `DEBUG: Attempting sign in with email: user@example.com` - Request started
- `DEBUG: Sign in successful` - Authentication succeeded
- `DEBUG: User authenticated successfully` - Session established
- `DEBUG: Sign in error: [error message]` - Authentication failed with reason
- `DEBUG: Full error: [detailed error]` - Complete error information

**Monitoring the Console:**
1. Open Xcode Console (View → Debug Area → Show Debug Area)
2. Attempt to sign in
3. Watch for debug messages to trace where the request fails

### 5. Network Connectivity Test

Add this test view to verify basic network connectivity:

```swift
import Alamofire

struct NetworkTestView: View {
    @State private var result = "Testing..."

    var body: some View {
        VStack {
            Text(result)
                .onAppear {
                    AF.request("https://mpicqllpqtwfafqppwal.supabase.co/health")
                        .response { response in
                            result = "Status: \(response.response?.statusCode ?? -1)"
                        }
                }
        }
    }
}
```

### 6. Production vs Development Environment

If using preview/development environment:
- Verify the Supabase project is in the development environment
- Check that email sign-in is enabled in Supabase auth settings
- Ensure the user account exists and is confirmed (if email verification is enabled)

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Simulator can't reach backend | "Connection has no local endpoint" | Use real device or configure simulator network |
| Firewall blocking access | Request times out | Check firewall rules, verify port 443 is open |
| Supabase project paused | Silent timeout | Check Supabase dashboard status |
| Invalid credentials | 401 Unauthorized | Verify API key in SupabaseConfig.swift |
| User not confirmed | Error response | Confirm user email in Supabase dashboard |

## Next Steps

1. **Verify the Supabase backend is running and accessible:**
   ```bash
   curl -I https://mpicqllpqtwfafqppwal.supabase.co
   ```

2. **Run on a physical device instead of simulator:**
   - Connect an iPhone/iPad via USB
   - Select it in Xcode and build/run
   - Test sign in

3. **Check the Xcode Console for enhanced debug logs:**
   - Look for the new `DEBUG:` messages added to AuthManager
   - These will show exactly where the request fails

4. **Verify Supabase authentication settings:**
   - Visit your Supabase dashboard
   - Check Authentication → Providers → Email is enabled
   - Verify the test user account exists and is confirmed

## Code Changes Made

- Enhanced `signIn()` method with detailed debug logging
- Enhanced `signUp()` method with detailed debug logging
- Error messages now use `error.localizedDescription` for clarity
- All errors are properly captured and displayed in the UI

## Testing Sign-In

Once network connectivity is restored:
1. Navigate to LoginView
2. Enter email and password
3. Watch Xcode Console for `DEBUG:` messages
4. Check for error in red box if sign-in fails
5. You should see success message and be routed to Dashboard
