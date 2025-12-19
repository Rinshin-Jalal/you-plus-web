# YOU+ LiveKit Deployment Checklist

Quick reference checklist for deploying the LiveKit migration to production.

---

## Pre-Deployment Checklist

### ☐ Phase 0: Planning & Preparation

- [ ] Read `MIGRATION_GUIDE.md` completely
- [ ] Review `ENVIRONMENT_SETUP.md` for all services
- [ ] Set up development environment
- [ ] Create deployment schedule (off-peak hours recommended)
- [ ] Notify team of deployment window
- [ ] Prepare rollback plan

### ☐ Phase 1: Infrastructure Setup

#### LiveKit Cloud
- [ ] Sign up for LiveKit Cloud account
- [ ] Create production project: `youplus-production`
- [ ] Note API Key, API Secret, WebSocket URL
- [ ] Configure webhook: `https://youplus-backend.workers.dev/webhook/livekit`
- [ ] Select events: room_started, room_finished, participant_joined, participant_left
- [ ] Save webhook secret
- [ ] Test connection with LiveKit CLI

#### Credentials Checklist
- [ ] LiveKit URL: `wss://youplus-xxxxx.livekit.cloud`
- [ ] LiveKit API Key: `APIxxxxxxxxxx`
- [ ] LiveKit API Secret: `secret_xxxxxxxxxx`
- [ ] LiveKit Webhook Secret: `whsec_xxxxxxxxxx`

---

## Development Environment Deployment

### ☐ Phase 2: Backend Integration (Dev)

#### Install Dependencies
- [ ] `cd backend`
- [ ] `npm install livekit-server-sdk`
- [ ] `npm install --save-dev @types/node`

#### Create Files
- [ ] Create `backend/src/features/livekit/router.ts`
- [ ] Create `backend/src/features/webhook/handlers/livekit-webhooks.ts`
- [ ] Update `backend/src/index.ts` with new routes
- [ ] Update `backend/src/features/webhook/router.ts`

#### Environment Variables (Local)
- [ ] Create `backend/.env` with all LiveKit variables
- [ ] Verify all variables present: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, etc.

#### Test Locally
- [ ] `npm run dev`
- [ ] Test health endpoint: `curl http://localhost:8787/health`
- [ ] Verify no TypeScript errors
- [ ] Test token generation endpoint (requires auth setup)

---

### ☐ Phase 3: iOS App Integration (Dev)

#### Add LiveKit SDK
- [ ] Open `youplus.xcodeproj` in Xcode
- [ ] File → Add Packages
- [ ] Add: `https://github.com/livekit/client-sdk-swift`
- [ ] Select version: `2.0.0` or later
- [ ] Add to target: `youplus`

#### Create Files
- [ ] Create `Core/Services/LiveKitVoiceService.swift`
- [ ] Update `Features/Call/CallViewModel.swift`
- [ ] Update `Features/Call/CallView.swift`

#### Update Configuration
- [ ] Update `Core/Config.swift` with backend URL
- [ ] Verify `Info.plist` has microphone permissions
- [ ] Verify `Info.plist` has UIBackgroundModes: audio, voip

#### Test in Simulator
- [ ] Clean build folder: `Cmd+Shift+K`
- [ ] Build: `Cmd+B`
- [ ] Run: `Cmd+R`
- [ ] Verify no compilation errors
- [ ] Test on physical device (simulator may have audio issues)

---

### ☐ Phase 4: Agent Deployment (Dev)

#### Setup Environment
- [ ] `cd agent-livekit`
- [ ] Create `.env` with all required variables
- [ ] `python3.12 -m venv .venv`
- [ ] `source .venv/bin/activate`
- [ ] `pip install -r requirements.txt`

#### Test Locally
- [ ] `python main.py dev`
- [ ] Verify output: "Worker ready, waiting for jobs..."
- [ ] Check all services load correctly
- [ ] No import errors or missing dependencies

#### Deploy to Railway (Staging)
- [ ] `npm install -g @railway/cli`
- [ ] `railway login`
- [ ] `railway init` (create new project: `youplus-agent-staging`)
- [ ] `railway variables set LIVEKIT_URL=...` (all variables)
- [ ] `railway up`
- [ ] `railway status` - verify running
- [ ] `railway logs` - check for errors

---

## Integration Testing

### ☐ Phase 5: End-to-End Testing (Dev)

#### Backend Tests
- [ ] Test token generation: `POST /api/livekit/token`
  - Response includes: token, url, roomName
  - Token is valid JWT
- [ ] Test room scheduling: `POST /api/livekit/schedule-call`
  - Creates call record in Supabase
  - Returns room_name and call_id
- [ ] Test webhook: `POST /webhook/livekit` (simulate from LiveKit)
  - Updates call_analytics table

#### iOS App Tests
- [ ] Login with test account
- [ ] Navigate to Call screen
- [ ] Tap "Start Call"
- [ ] Verify CallKit call appears
- [ ] Verify LiveKit connection succeeds
- [ ] Check LiveKit dashboard for room creation
- [ ] Verify agent joins room (check agent logs)

#### Voice Quality Tests
- [ ] Speak: "Hi, Future Self"
- [ ] Agent responds within 2 seconds
- [ ] Audio quality is clear (no distortion, echo)
- [ ] Test excuse detection: "I was too tired"
  - Check logs for "🎯 Excuse detected"
- [ ] Test commitment: "I'll wake up at 6am tomorrow"
  - Check logs for "📝 Commitment"
- [ ] End call
- [ ] Verify call_analytics record saved to Supabase

#### Data Verification
- [ ] Check `call_analytics` table in Supabase
- [ ] Verify fields populated: user_id, room_name, status, started_at, ended_at
- [ ] Check `status` table for streak updates (if applicable)

---

## Production Deployment

### ☐ Phase 6: Backend Production Deployment

#### Environment Variables (Cloudflare)
- [ ] Go to Cloudflare Dashboard
- [ ] Workers & Pages → youplus-backend → Settings → Variables
- [ ] Add all LiveKit variables (use "Encrypt" for secrets)
- [ ] Verify all existing variables still present

#### Deploy
- [ ] `cd backend`
- [ ] `npm run build`
- [ ] `npm run deploy`
- [ ] Verify deployment: `https://youplus-backend.workers.dev/health`

#### Verify
- [ ] Test token endpoint in production
- [ ] Check Cloudflare logs for errors
- [ ] Verify webhook URL accessible from LiveKit

---

### ☐ Phase 7: Agent Production Deployment

#### Deploy to Railway (Production)
- [ ] Create new Railway project: `youplus-agent-production`
- [ ] `railway link` (select production project)
- [ ] Set all production environment variables
  - [ ] `LIVEKIT_URL` (production LiveKit project)
  - [ ] `LIVEKIT_API_KEY` (production)
  - [ ] `LIVEKIT_API_SECRET` (production)
  - [ ] `BEDROCK_API_KEY`
  - [ ] `DEEPGRAM_API_KEY`
  - [ ] `CARTESIA_API_KEY`
  - [ ] `SUPABASE_URL` (production)
  - [ ] `SUPABASE_SERVICE_KEY` (production)
  - [ ] `BACKEND_URL` (production)
  - [ ] `LOG_LEVEL=INFO`
- [ ] `railway up`
- [ ] Monitor logs: `railway logs --tail`
- [ ] Verify: "Worker ready, waiting for jobs..."

#### Health Check
- [ ] Agent connects to LiveKit successfully
- [ ] No connection errors in logs
- [ ] Can query Supabase successfully

---

### ☐ Phase 8: Lambda Update

#### Update Code
- [ ] `cd lambda/daily-call-trigger`
- [ ] Update `index.js` with LiveKit scheduling logic
- [ ] Replace Cartesia call with backend API call

#### Update Environment Variables
- [ ] AWS Console → Lambda → youplus-daily-call-trigger
- [ ] Configuration → Environment variables
- [ ] Update `BACKEND_URL` (if changed)
- [ ] Add `BACKEND_API_KEY`

#### Deploy
- [ ] `zip -r function.zip .`
- [ ] Upload via AWS Console or CLI:
  ```bash
  aws lambda update-function-code \
    --function-name youplus-daily-call-trigger \
    --zip-file fileb://function.zip
  ```

#### Test
- [ ] Test invoke with test payload
- [ ] Check backend logs for room creation
- [ ] Verify Supabase record created

---

### ☐ Phase 9: iOS App Production Build

#### Pre-Build
- [ ] Update version number in Xcode
- [ ] Update `Config.swift` with production backend URL
- [ ] Clean build folder: `Cmd+Shift+K`
- [ ] Archive: Product → Archive

#### TestFlight Beta
- [ ] Upload to App Store Connect
- [ ] Submit for TestFlight review
- [ ] Add internal testers
- [ ] Wait for approval (~2 hours)
- [ ] Test with beta users (5-10 people)
- [ ] Monitor feedback and crash reports

#### App Store Release (After Beta Success)
- [ ] Submit for App Store review
- [ ] Wait for approval (~24-48 hours)
- [ ] Release to production (manual or automatic)

---

## Gradual Rollout

### ☐ Phase 10: Feature Flag Rollout

#### Week 1: Internal Testing (0-5 users)
- [ ] Enable LiveKit for your own account
- [ ] Enable for 5 internal team members
- [ ] Monitor for 7 days
- [ ] Daily check: error rates, call success rates
- [ ] Fix any critical issues

#### Week 2: Beta Users (5-20 users)
- [ ] Enable for 10-20 beta testers
- [ ] Send announcement email with new feature
- [ ] Collect feedback via survey
- [ ] Monitor daily
- [ ] Iterate on issues

#### Week 3: Small Rollout (10% of users)
- [ ] Enable for 10% of active users
- [ ] A/B test: 10% LiveKit, 90% Cartesia Line
- [ ] Compare metrics:
  - [ ] Call success rate
  - [ ] Average call duration
  - [ ] User satisfaction
  - [ ] Cost per call
- [ ] Monitor for 7 days

#### Week 4: Wider Rollout (25% → 50% → 100%)
- [ ] Day 1: 25% of users
- [ ] Day 3: 50% of users
- [ ] Day 5: 75% of users
- [ ] Day 7: 100% of users (if no critical issues)

---

## Post-Deployment Monitoring

### ☐ Phase 11: Monitoring & Validation

#### Technical Metrics (Monitor Daily)
- [ ] Connection success rate: > 95%
- [ ] Call completion rate: > 90%
- [ ] Average latency: < 500ms
- [ ] Error rate: < 5%
- [ ] Agent uptime: > 99%

#### Business Metrics (Monitor Weekly)
- [ ] Cost per call: < $0.02
- [ ] User satisfaction: > 4.5/5
- [ ] Average call duration: 3-5 minutes
- [ ] Daily active users: same or higher
- [ ] Retention rate: same or higher

#### Monitoring Tools
- [ ] LiveKit Dashboard: https://cloud.livekit.io/dashboard
- [ ] Cloudflare Analytics: https://dash.cloudflare.com
- [ ] Railway Metrics: https://railway.app/metrics
- [ ] Supabase Dashboard: https://app.supabase.com
- [ ] Sentry (if configured): https://sentry.io

#### Daily Checks (First Week)
- [ ] Check Railway logs for agent errors
- [ ] Check Cloudflare logs for backend errors
- [ ] Check LiveKit dashboard for failed rooms
- [ ] Check Supabase for incomplete call records
- [ ] Review user feedback/support tickets

#### Weekly Checks (After First Week)
- [ ] Review cost reports (LiveKit, Deepgram, Cartesia)
- [ ] Compare costs: LiveKit vs Cartesia Line
- [ ] Review user surveys/feedback
- [ ] Check for performance degradation
- [ ] Review error trends

---

## Rollback Plan

### ☐ Emergency Rollback (Critical Issues)

#### Severity 1: Immediate Rollback Required
**Triggers**:
- Connection success rate < 80%
- Agent crashes repeatedly
- Data loss detected
- Security vulnerability discovered

**Actions**:
1. [ ] Disable LiveKit feature flag immediately
2. [ ] Revert Lambda to previous version (Cartesia Line)
3. [ ] Rollback backend to previous deployment
4. [ ] Keep agent-livekit running (doesn't hurt)
5. [ ] Notify users of temporary issue
6. [ ] Debug offline, redeploy when fixed

#### Commands:
```bash
# Rollback backend
cd backend
wrangler rollback

# Rollback Lambda
aws lambda update-function-code \
  --function-name youplus-daily-call-trigger \
  --s3-bucket your-backup-bucket \
  --s3-key previous-version.zip

# Disable feature flag
UPDATE users SET feature_flags = jsonb_set(
  feature_flags, '{livekit_enabled}', 'false'
) WHERE feature_flags->>'livekit_enabled' = 'true';
```

#### Severity 2: Gradual Rollback
**Triggers**:
- Connection success rate 80-90%
- Minor issues affecting some users
- Cost overruns
- Performance degradation

**Actions**:
1. [ ] Reduce feature flag to 50% → 25% → 10% → 0%
2. [ ] Debug issues with small group
3. [ ] Fix and redeploy
4. [ ] Resume gradual rollout

---

## Cleanup (After 2 Weeks of Stable LiveKit)

### ☐ Phase 12: Remove Old Cartesia Line Code

#### If LiveKit is 100% Successful:
- [ ] Remove `agent/` directory (keep backup)
- [ ] Remove Cartesia Line dependencies from Lambda
- [ ] Remove old API routes from backend
- [ ] Archive Cartesia Line deployment guide
- [ ] Update all documentation
- [ ] Celebrate! 🎉

#### Cost Comparison
- [ ] Calculate total savings: LiveKit vs Cartesia Line
- [ ] Project annual savings
- [ ] Report to stakeholders

---

## Sign-Off Checklist

### Deployment Complete When:
- [ ] All phases 1-11 completed
- [ ] No critical errors for 7 days
- [ ] Connection success rate > 95%
- [ ] User satisfaction maintained or improved
- [ ] Cost per call < $0.02
- [ ] All team members trained on new system
- [ ] Documentation updated
- [ ] Rollback plan tested (dry run)

### Responsible Parties
- [ ] **Backend**: ___________________
- [ ] **iOS**: ___________________
- [ ] **Agent**: ___________________
- [ ] **DevOps**: ___________________
- [ ] **QA**: ___________________
- [ ] **Product Manager**: ___________________

### Approval
- [ ] Engineering Lead: ___________________
- [ ] Product Manager: ___________________
- [ ] CTO: ___________________

---

## Quick Reference Commands

### Check Status
```bash
# Backend
curl https://youplus-backend.workers.dev/health

# Agent
railway status && railway logs --tail

# iOS
# Check TestFlight or App Store Connect

# Lambda
aws lambda get-function --function-name youplus-daily-call-trigger
```

### Emergency Contacts
- **LiveKit Support**: support@livekit.io
- **Engineering Team**: #youplus-engineering (Slack)
- **On-Call**: [Phone number]

---

**Last Updated**: 2025-12-19
**Version**: 1.0
**Status**: Ready for Deployment
