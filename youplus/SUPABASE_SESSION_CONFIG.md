# Supabase Session Configuration: emitLocalSessionAsInitialSession

**Status**: ✅ Implemented
**Reference**: https://github.com/supabase/supabase-swift/pull/844

---

## What This Does

The `emitLocalSessionAsInitialSession: true` configuration ensures that:

1. **Locally stored sessions are emitted immediately** as the initial session event
2. **Users stay logged in** even while background token refresh happens
3. **No "ghost sessions"** where users appear logged in then suddenly lose authentication
4. **Future-proof** - this will be the default behavior in Supabase Swift v3.0.0

---

## The Problem It Solves

Without this configuration, the following sequence could occur:

```
1. User closes app while logged in
2. App launches, auth listener starts
3. Auth listener attempts to refresh token in background
4. Meanwhile, app shows user as NOT authenticated
5. User sees login screen temporarily
6. Token refresh completes, auth updates
7. User gets logged back in

Result: Confusing "flash" of logout/login
```

With `emitLocalSessionAsInitialSession: true`:

```
1. User closes app while logged in
2. App launches
3. Immediately emit stored session (user sees they're logged in)
4. Auth listener refreshes token in background
5. Session updates with refreshed token
6. Smooth, seamless experience

Result: User stays logged in the entire time
```

---

## Implementation

### Location
File: `youplus/Core/Auth/AuthManager.swift` (lines 16-46)

### Code
```swift
init() {
    do {
        // Create auth client with emitLocalSessionAsInitialSession enabled
        let authClient = AuthClient(
            url: SupabaseConfig.shared.url,
            headers: HTTPHeaders(),
            localStorage: UserDefaults.standard,
            emitLocalSessionAsInitialSession: true
        )

        self.supabase = SupabaseClient(
            supabaseURL: SupabaseConfig.shared.url,
            supabaseKey: SupabaseConfig.shared.anonKey,
            auth: authClient
        )
    } catch {
        // ... error handling
    }
}
```

### Key Components

1. **`AuthClient` Creation**
   - `url`: Supabase URL (from config)
   - `headers`: Empty HTTP headers
   - `localStorage`: Uses `UserDefaults.standard` for persistence
   - `emitLocalSessionAsInitialSession: true` - **The magic flag**

2. **Passed to `SupabaseClient`**
   - The configured `authClient` is passed via the `auth:` parameter
   - This tells SupabaseClient to use our custom auth configuration

---

## Session Expiration Checking

Combined with the `!session.isExpired` checks already implemented:

```swift
// In setupAuthStateListener()
if let session = session, !session.isExpired {
    self.isAuthenticated = true
    // ...
}

// In checkSession()
if !session.isExpired {
    self.isAuthenticated = true
    // ...
}
```

This creates a **complete solution**:
1. ✅ Emit locally stored sessions immediately
2. ✅ Check if they're expired before using
3. ✅ Refresh tokens in background
4. ✅ Update auth state properly

---

## Benefits

| Benefit | Details |
|---------|---------|
| **Better UX** | No confusing logout/login flashes |
| **Faster Startup** | Sessions available immediately |
| **More Reliable** | Handles token refresh gracefully |
| **Future-Proof** | Will be default in v3.0.0 |
| **Compliant** | Follows Supabase best practices |

---

## Testing the Configuration

### What You Should See

**On First Launch (No Session)**
```
DEBUG: Checking session...
DEBUG: No session
[App shows login screen]
```

**Sign In Successfully**
```
DEBUG: Attempting sign in with email: user@example.com
DEBUG: Sign in successful
DEBUG: User authenticated successfully
DEBUG: Auth state changed - session valid, authenticated
[App navigates to Dashboard]
```

**Subsequent Launches (With Valid Session)**
```
DEBUG: Checking session...
DEBUG: Session found, valid, and authenticated
[App goes directly to Dashboard - NO login screen flash]
```

**After Session Expires**
```
DEBUG: Auth state changed - session expired
[App navigates back to login screen]
```

---

## Technical Details

### Why localStorage = UserDefaults.standard?

Supabase stores the session token locally for persistence:
- On app restart, it loads the stored session
- With `emitLocalSessionAsInitialSession: true`, it emits this session immediately
- The expiration check (`!session.isExpired`) ensures we don't use expired tokens

### The Complete Flow

```
App Launch
    ↓
AuthManager.init()
    ↓
Create AuthClient with emitLocalSessionAsInitialSession: true
    ↓
AuthClient loads stored session from UserDefaults
    ↓
checkSession() - checks if stored session is valid
    ↓
setupAuthStateListener() - listens for auth state changes
    ↓
Background Token Refresh (if needed)
    ↓
Update UI with valid session state
```

---

## References

- **PR #822**: Initial proposal for this feature
  - https://github.com/supabase/supabase-swift/pull/822
  - Explains the problem and solution concept

- **PR #844**: Implementation details
  - https://github.com/supabase/supabase-swift/pull/844
  - Shows the actual code implementation

- **Why traits didn't work**: iOS SPM limitation
  - iOS projects can't enable Swift 6.1 traits through Xcode UI
  - Runtime configuration flag is more practical

---

## Migration for Other Projects

If you're using Supabase in other Swift projects, apply this same pattern:

```swift
let authClient = AuthClient(
    url: supabaseURL,
    headers: HTTPHeaders(),
    localStorage: UserDefaults.standard,
    emitLocalSessionAsInitialSession: true  // Add this line
)

let client = SupabaseClient(
    supabaseURL: supabaseURL,
    supabaseKey: anonKey,
    auth: authClient
)
```

---

## Future Changes (v3.0.0)

When Supabase Swift v3.0.0 is released:
- `emitLocalSessionAsInitialSession` will default to `true`
- This code will continue to work (explicitly setting it is not harmful)
- You can remove the explicit configuration if desired, but leaving it ensures compatibility

---

## Summary

✅ **Configuration implemented and working**
✅ **Prevents session flash/logout on app restart**
✅ **Session expiration properly checked**
✅ **Future-proof for SDK upgrades**
✅ **Best practice for Supabase Swift**

---

**Last Updated**: 2025-12-18
**Status**: ✅ Production Ready
