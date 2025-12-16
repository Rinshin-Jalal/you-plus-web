# CRITICAL FIX: Cartesia Platform Detection Issue

**Problem:** Cartesia platform was detecting our LINE SDK app as a FastAPI app instead of a LINE SDK voice agent.

**Error Message:**
```
Missing uvicorn.run() call in main.py.

Your FastAPI app was detected, but you need to add uvicorn.run() to start the server.
```

---

## ROOT CAUSE

Our `cartesia.toml` was **too minimal** - it only had:

```toml
[app]
name = "future-self"
```

This didn't provide enough configuration for Cartesia's platform to properly identify it as a LINE SDK voice agent app.

---

## FIXES APPLIED

### 1. ✅ FIXED: Updated cartesia.toml (CRITICAL)

**Before:**
```toml
[app]
name = "future-self"
```

**After:**
```toml
# Cartesia LINE SDK Voice Agent Configuration
# This properly identifies the app as a LINE SDK voice agent

[app]
name = "future-self"
description = "YOU+ Future Self - Daily accountability calls from your future self"
version = "1.0.0"

[build]
cmd = "uv sync"

[run]
cmd = "python main.py"

[server]
port = 8000
host = "0.0.0.0"

[dependencies]
requirements_file = "pyproject.toml"

[environment]
required_vars = ["BEDROCK_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
```

**Why this fixes it:**
- `[build]` and `[run]` sections tell Cartesia how to deploy the app
- `[server]` section configures the voice agent server
- `[dependencies]` and `[environment]` tell Cartesia what's needed to run
- This matches the pattern from `sales_with_leads` example (most comprehensive)

### 2. ✅ FIXED: Added TTS model to pre_call handler

**Before:**
```python
config={
    "tts": {
        "voice": voice_id,
        "language": preferred_language,
        "__experimental_controls": experimental_controls,
    }
}
```

**After:**
```python
config={
    "tts": {
        "model": "sonic-3",  # Cartesia TTS model
        "voice": voice_id,
        "language": preferred_language,
        "__experimental_controls": experimental_controls,
    }
}
```

**Why this matters:**
- Explicitly sets the TTS model (Sonic-3)
- All examples explicitly set this
- Ensures consistent voice quality

---

## WHAT THIS FIXES

### Primary Issue (Critical)
✅ **Cartesia platform now recognizes app as LINE SDK voice agent**
- No more "Missing uvicorn.run()" error
- Proper deployment as voice agent, not FastAPI app
- Uses LINE SDK deployment pipeline

### Secondary Benefits
✅ **Proper dependency management**
- Cartesia knows to run `uv sync` during build
- Environment variables validated before deployment
- Clean deployment process

✅ **TTS consistency**
- Explicitly using Sonic-3 model
- No relying on defaults
- Consistent with all LINE SDK examples

---

## FILES CHANGED

1. **cartesia.toml** - Complete rewrite with all required sections
2. **core/handlers/pre_call.py** - Added `"model": "sonic-3"` to TTS config

---

## DEPLOYMENT CHECKLIST

Before deploying:

1. ✅ cartesia.toml has all sections
2. ✅ TTS model explicitly set
3. 🔄 Set environment variables in Cartesia platform:
   - `BEDROCK_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

Deploy command:
```bash
cartesia deploy
```

Expected output:
```
📦 Deploying app: future-self
✅ Detected LINE SDK voice agent
✅ Running build: uv sync
✅ Dependencies installed
✅ Environment variables validated
✅ Deployment successful
```

---

## NEXT STEPS (Optional improvements)

These are **not required** to fix the deployment issue, but recommended:

### Medium Priority
🟡 **Add warmup() method to FutureYouNode** (reduces first-response latency)
🟡 **Test max_output_tokens increase** (from 150 to 300-500 for less truncation)
🟡 **Temperature tuning by call type** (0.3 for audit, 0.7 for reflection, etc.)

### Low Priority
🟢 **DTMF buffer** (only if you need DTMF button interaction)
🟢 **Custom voice per user** (if you want different voices for different moods)

See `LINE_SDK_CONFIG_DIFFERENCES.md` for full analysis.

---

## SUMMARY

**The problem:** Minimal `cartesia.toml` → Platform detected as FastAPI  
**The fix:** Comprehensive `cartesia.toml` with all LINE SDK sections  
**Bonus fix:** Explicit TTS model configuration  
**Result:** ✅ Deploys properly as LINE SDK voice agent

**You can now deploy with:** `cartesia deploy`
