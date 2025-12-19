# YOU+ LiveKit Environment Setup

Complete environment configuration for all components of the LiveKit migration.

---

## Table of Contents

1. [LiveKit Cloud](#livekit-cloud)
2. [Backend (Cloudflare Workers)](#backend-cloudflare-workers)
3. [Agent (Python)](#agent-python)
4. [iOS App](#ios-app)
5. [Lambda (AWS)](#lambda-aws)
6. [Database (Supabase)](#database-supabase)
7. [Verification](#verification)

---

## LiveKit Cloud

### Sign Up

1. Go to: https://cloud.livekit.io
2. Sign up with email or GitHub
3. Create a new project: `youplus-production`

### Get Credentials

Navigate to: Settings → Keys

```bash
LiveKit URL: wss://youplus-xxxxxxx.livekit.cloud
API Key: APIxxxxxxxxxxxxxxxxxxxxxxxxxx
API Secret: secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Configure Webhooks

Settings → Webhooks → Add webhook

```
URL: https://youplus-backend.workers.dev/webhook/livekit
Events:
  ☑️ room_started
  ☑️ room_finished
  ☑️ participant_joined
  ☑️ participant_left

Webhook Secret: whsec_xxxxxxxxxxxxxxxxxxxxxxx
```

---

## Backend (Cloudflare Workers)

### Local Development

Create `backend/.env`:

```bash
# LiveKit Configuration
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_URL=wss://youplus-xxxxxxx.livekit.cloud
LIVEKIT_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxx

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend
BACKEND_URL=http://localhost:8787
BACKEND_API_KEY=dev_api_key_change_in_production

# External Services
CARTESIA_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Production (Cloudflare Dashboard)

1. Go to: https://dash.cloudflare.com
2. Workers & Pages → youplus-backend → Settings → Variables
3. Add environment variables (click "Add variable" for each):

```
LIVEKIT_API_KEY (encrypted)
LIVEKIT_API_SECRET (encrypted)
LIVEKIT_URL (plain text)
LIVEKIT_WEBHOOK_SECRET (encrypted)
SUPABASE_URL (plain text)
SUPABASE_SERVICE_KEY (encrypted)
SUPABASE_ANON_KEY (encrypted)
BACKEND_URL (plain text) = https://youplus-backend.workers.dev
BACKEND_API_KEY (encrypted)
CARTESIA_API_KEY (encrypted)
STRIPE_SECRET_KEY (encrypted)
STRIPE_WEBHOOK_SECRET (encrypted)
```

### Wrangler CLI

```bash
# Set secrets via CLI
echo "your_livekit_api_key" | wrangler secret put LIVEKIT_API_KEY
echo "your_livekit_api_secret" | wrangler secret put LIVEKIT_API_SECRET
echo "your_webhook_secret" | wrangler secret put LIVEKIT_WEBHOOK_SECRET
```

---

## Agent (Python)

### Local Development

Create `agent-livekit/.env`:

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://youplus-xxxxxxx.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# LLM & Speech Services
BEDROCK_API_KEY=your_bedrock_api_key_here
CARTESIA_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Database
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend
BACKEND_URL=https://youplus-backend.workers.dev

# Optional Services
SUPERMEMORY_API_KEY=your_supermemory_key (optional)

# Logging
LOG_LEVEL=INFO
```

### Production (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
cd agent-livekit
railway link

# Set variables (one by one)
railway variables set LIVEKIT_URL=wss://youplus-xxxxxxx.livekit.cloud
railway variables set LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxxxxxxxxxxxx
railway variables set LIVEKIT_API_SECRET=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
railway variables set BEDROCK_API_KEY=your_bedrock_api_key
railway variables set CARTESIA_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
railway variables set SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
railway variables set SUPABASE_SERVICE_KEY=eyJhbGc...
railway variables set BACKEND_URL=https://youplus-backend.workers.dev
railway variables set SUPERMEMORY_API_KEY=your_key (optional)
railway variables set LOG_LEVEL=INFO
```

Or via Railway dashboard:
1. Go to: https://railway.app/dashboard
2. Select `youplus-agent` project
3. Variables tab → Add each variable

### Production (Fly.io)

```bash
# Install Fly CLI
brew install flyctl

# Login
fly auth login

# Set secrets
cd agent-livekit
fly secrets set LIVEKIT_URL=wss://youplus-xxxxxxx.livekit.cloud
fly secrets set LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxxxxxxxxxxxx
fly secrets set LIVEKIT_API_SECRET=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
fly secrets set BEDROCK_API_KEY=your_bedrock_api_key
fly secrets set CARTESIA_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
fly secrets set SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
fly secrets set SUPABASE_SERVICE_KEY=eyJhbGc...
fly secrets set BACKEND_URL=https://youplus-backend.workers.dev
fly secrets set LOG_LEVEL=INFO
```

---

## iOS App

### Xcode Configuration

**Config.swift** - Update with your backend URL:

```swift
// youplus/youplus/Core/Config.swift
struct Config {
    static let backendURL = "https://youplus-backend.workers.dev"
    static let supabaseURL = "https://xxxxxxxxxxxxx.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**No .env file needed** - iOS uses hardcoded constants

### Build Configurations

Xcode → Project → Info → Configurations

**Debug** (Development):
```
BACKEND_URL = https://youplus-backend-dev.workers.dev
```

**Release** (Production):
```
BACKEND_URL = https://youplus-backend.workers.dev
```

### Info.plist

Ensure these permissions exist:

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

---

## Lambda (AWS)

### Environment Variables

AWS Console → Lambda → youplus-daily-call-trigger → Configuration → Environment variables

```bash
BACKEND_URL = https://youplus-backend.workers.dev
BACKEND_API_KEY = your_backend_api_key_change_in_production
SUPABASE_URL = https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGc...

# Optional: for push notifications
APNS_KEY_ID = your_apns_key_id
APNS_TEAM_ID = your_team_id
APNS_P8_KEY = -----BEGIN PRIVATE KEY-----...
```

### Set via AWS CLI

```bash
aws lambda update-function-configuration \
  --function-name youplus-daily-call-trigger \
  --environment "Variables={
    BACKEND_URL=https://youplus-backend.workers.dev,
    BACKEND_API_KEY=your_backend_api_key,
    SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co,
    SUPABASE_SERVICE_KEY=eyJhbGc...
  }"
```

---

## Database (Supabase)

### Required Tables

The migration reuses existing tables with some additions:

**call_analytics** - Add column for LiveKit:
```sql
ALTER TABLE call_analytics
ADD COLUMN IF NOT EXISTS room_name TEXT;

CREATE INDEX IF NOT EXISTS idx_call_analytics_room_name
ON call_analytics(room_name);
```

**users** - Add feature flag column (optional):
```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}';

-- Example usage
UPDATE users
SET feature_flags = jsonb_set(
  COALESCE(feature_flags, '{}'),
  '{livekit_enabled}',
  'true'
)
WHERE id = 'user_id_here';
```

### Run Migrations

```bash
# Via Supabase Dashboard
1. Go to SQL Editor
2. Paste migration SQL
3. Run

# Or via Supabase CLI
supabase db push
```

---

## Verification

### Check All Components

#### 1. LiveKit Cloud
```bash
# Verify project is active
curl https://youplus-xxxxxxx.livekit.cloud

# Should return 404 (expected - means server is running)
```

#### 2. Backend
```bash
# Health check
curl https://youplus-backend.workers.dev/health

# Test LiveKit token endpoint (requires auth token)
curl -X POST https://youplus-backend.workers.dev/api/livekit/token \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"

# Should return: {"token": "eyJhbGc...", "url": "wss://...", "roomName": "..."}
```

#### 3. Agent
```bash
# Check agent is running
railway status
# or
fly status

# Check logs
railway logs --tail
# or
fly logs
```

#### 4. iOS App
```bash
# Build and run in Xcode
open youplus/youplus.xcodeproj

# Check console for:
# ✅ Backend URL: https://youplus-backend.workers.dev
# ✅ Supabase configured
```

#### 5. Lambda
```bash
# Test invoke
aws lambda invoke \
  --function-name youplus-daily-call-trigger \
  --payload '{"detail":{"userId":"test_user_id"}}' \
  response.json

# Check response.json
cat response.json
```

---

## Environment Variables Quick Reference

### All Services Overview

| Variable | Backend | Agent | Lambda | iOS |
|----------|---------|-------|--------|-----|
| LIVEKIT_URL | ✅ | ✅ | ❌ | ❌ |
| LIVEKIT_API_KEY | ✅ | ✅ | ❌ | ❌ |
| LIVEKIT_API_SECRET | ✅ | ✅ | ❌ | ❌ |
| LIVEKIT_WEBHOOK_SECRET | ✅ | ❌ | ❌ | ❌ |
| SUPABASE_URL | ✅ | ✅ | ✅ | ✅ |
| SUPABASE_SERVICE_KEY | ✅ | ✅ | ✅ | ❌ |
| SUPABASE_ANON_KEY | ✅ | ❌ | ❌ | ✅ |
| BEDROCK_API_KEY | ❌ | ✅ | ❌ | ❌ |
| CARTESIA_API_KEY | ✅ | ✅ | ❌ | ❌ |
| BACKEND_URL | ❌ | ✅ | ✅ | ✅ |
| BACKEND_API_KEY | ❌ | ❌ | ✅ | ❌ |

### Security Best Practices

1. **Never commit .env files**
   - Add to .gitignore
   - Use .env.example for templates

2. **Rotate secrets regularly**
   - Every 90 days for API keys
   - Immediately if compromised

3. **Use encrypted variables**
   - Mark sensitive vars as "encrypted" in Cloudflare
   - Use Railway/Fly secrets (not plain env vars)

4. **Separate dev/prod**
   - Different LiveKit projects
   - Different Supabase projects
   - Different backend URLs

5. **Access control**
   - Limit who can view production secrets
   - Use IAM roles for AWS
   - Use team features in Cloudflare/Railway

---

## Troubleshooting Environment Issues

### Common Problems

#### "Missing required env var: LIVEKIT_URL"

**Solution**: Verify variable is set correctly
```bash
# Agent
cat agent-livekit/.env | grep LIVEKIT_URL

# Backend (Cloudflare)
wrangler secret list

# Check if deployed
railway variables
```

#### "Invalid LiveKit token"

**Cause**: Mismatched API key/secret

**Solution**:
1. Verify API key and secret match in LiveKit dashboard
2. Check for trailing spaces in .env file
3. Ensure secrets are properly base64 encoded (if applicable)

#### "Connection refused to Supabase"

**Cause**: Wrong URL or service key

**Solution**:
1. Verify URL: https://app.supabase.com/project/xxx/settings/api
2. Copy "Service Role" key (not "anon" key for backend/agent)
3. Check if Supabase project is paused (free tier)

#### "Cartesia API rate limit exceeded"

**Cause**: Sharing API key across environments

**Solution**:
1. Get separate Cartesia API keys for dev/prod
2. Implement rate limiting in agent
3. Consider upgrading Cartesia plan

---

**Last Updated**: 2025-12-19
**Status**: Ready for Use
