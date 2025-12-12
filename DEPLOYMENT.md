# YOU+ Deployment Guide

Complete guide to deploying all YOU+ services and configuring environment variables.

---

## Architecture Overview

```
                                    YOU+ ARCHITECTURE
                                    
    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │   NEXT.JS WEB   │     │   CF WORKER     │     │  CARTESIA AGENT │
    │   (Vercel)      │────▶│   (Cloudflare)  │────▶│  (Cartesia)     │
    │                 │     │                 │     │                 │
    │ - Onboarding UI │     │ - REST API      │     │ - Voice AI      │
    │ - Dashboard     │     │ - Webhooks      │     │ - Outbound calls│
    │ - Settings      │     │ - Auth          │     │ - STT/TTS       │
    └─────────────────┘     └────────┬────────┘     └─────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
            ▼                        ▼                        ▼
    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │   TRIGGER.DEV   │     │    SUPABASE     │     │       AWS       │
    │   (Background)  │     │   (Database)    │     │  (Scheduling)   │
    │                 │     │                 │     │                 │
    │ - Onboarding    │     │ - Users         │     │ - EventBridge   │
    │   processing    │     │ - Future Self   │     │ - Lambda        │
    │ - Voice clone   │     │ - Call logs     │     │ - Daily calls   │
    │ - Transcription │     │ - Payments      │     │                 │
    └─────────────────┘     └─────────────────┘     └─────────────────┘
            │                                              │
            │              ┌─────────────────┐             │
            └─────────────▶│  CLOUDFLARE R2  │◀────────────┘
                           │   (Storage)     │
                           │                 │
                           │ - Voice samples │
                           │ - Recordings    │
                           └─────────────────┘
```

---

## Platform Accounts Needed

| Platform | Purpose | Sign Up |
|----------|---------|---------|
| Supabase | Database & Auth | https://supabase.com |
| Cloudflare | Worker API & R2 Storage | https://cloudflare.com |
| Vercel | Next.js Frontend | https://vercel.com |
| Trigger.dev | Background Jobs | https://trigger.dev |
| Cartesia | Voice AI Agent | https://cartesia.ai |
| AWS | Daily Call Scheduling | https://aws.amazon.com |
| DodoPayments | Payment Processing | https://dodopayments.com |
| PostHog | Analytics (optional) | https://posthog.com |
| Sentry | Error Monitoring (optional) | https://sentry.io |

---

## 1. Supabase Setup

### Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization, name it `youplus`
4. Save the generated password
5. Select region closest to your users

### Get Credentials
Go to **Settings** > **API** and copy:

| Variable | Where to find |
|----------|---------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret!) |

### Run Migrations
```bash
cd migrations
# Run each migration in order
psql $DATABASE_URL < 009_future_self_system.sql
psql $DATABASE_URL < 010_dynamic_pillars.sql
# ... etc
```

---

## 2. Cloudflare Setup

### Create Account & Worker
1. Go to https://dash.cloudflare.com
2. Go to **Workers & Pages**
3. We'll deploy via Wrangler CLI (no manual creation needed)

### Create R2 Bucket
1. Go to **R2 Object Storage**
2. Click **Create bucket**
3. Name: `youplus-audio-recordings`
4. Keep default settings

### Get R2 Credentials (for Trigger.dev)
1. Go to **R2** > **Manage R2 API Tokens**
2. Click **Create API token**
3. Name: `youplus-trigger-access`
4. Permissions: **Object Read & Write**
5. Specify bucket: `youplus-audio-recordings`
6. Click **Create API Token**
7. Copy the credentials:

| Variable | Value |
|----------|-------|
| `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | Access Key ID shown |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key shown |
| `R2_BUCKET_NAME` | `youplus-audio-recordings` |

### Deploy Worker
```bash
cd backend

# Login to Cloudflare
npx wrangler login

# Set secrets (will prompt for values)
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put CARTESIA_API_KEY
npx wrangler secret put DODO_PAYMENTS_API_KEY
npx wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET
npx wrangler secret put AWS_ACCESS_KEY_ID
npx wrangler secret put AWS_SECRET_ACCESS_KEY
npx wrangler secret put AWS_LAMBDA_FUNCTION_ARN
npx wrangler secret put AWS_SCHEDULER_ROLE_ARN

# Deploy
npx wrangler deploy
```

---

## 3. AWS Setup (Daily Call Scheduling)

### 3.1 Create IAM User for CLI

1. Go to https://console.aws.amazon.com/iam/
2. Click **Users** > **Create user**
3. User name: `youplus-cli`
4. Click **Next**
5. Select **Attach policies directly**
6. Search and check: `AdministratorAccess`
7. Click **Next** > **Create user**
8. Click on the user > **Security credentials** tab
9. Click **Create access key** > **Command Line Interface (CLI)**
10. Check the confirmation > **Next** > **Create access key**
11. **Copy both keys immediately!**

| Variable | Value |
|----------|-------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` (20 characters) |
| `AWS_SECRET_ACCESS_KEY` | `...` (40 characters) |
| `AWS_REGION` | `us-east-1` |

### 3.2 Configure AWS CLI
```bash
aws configure
# Enter: Access Key ID, Secret Key, us-east-1, json
```

### 3.3 Run Infrastructure Setup
```bash
cd infrastructure
chmod +x setup-eventbridge.sh
./setup-eventbridge.sh
```

**Save the output!** You'll see:
```
Lambda Role ARN: arn:aws:iam::123456789:role/youplus-lambda-role
Scheduler Role ARN: arn:aws:iam::123456789:role/youplus-scheduler-role
Schedule Group: youplus-daily-calls
```

| Variable | Value |
|----------|-------|
| `AWS_SCHEDULER_ROLE_ARN` | `arn:aws:iam::...:role/youplus-scheduler-role` |
| `AWS_SCHEDULE_GROUP_NAME` | `youplus-daily-calls` |

### 3.4 Deploy Lambda Function

1. Go to https://console.aws.amazon.com/lambda/
2. Click **Create function**
3. Function name: `youplus-daily-call-trigger`
4. Runtime: **Node.js 20.x**
5. Architecture: **x86_64**
6. Click **Create function**

**Upload Code:**
```bash
cd lambda/daily-call-trigger
npm install
zip -r function.zip .
# Upload function.zip in Lambda console
```

**Or via AWS CLI:**
```bash
cd lambda/daily-call-trigger
npm install
zip -r function.zip .
aws lambda update-function-code \
  --function-name youplus-daily-call-trigger \
  --zip-file fileb://function.zip
```

**Set Lambda Environment Variables:**
In Lambda console > Configuration > Environment variables:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | Your Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `CARTESIA_API_KEY` | Your Cartesia API key |
| `CARTESIA_AGENT_ID` | Your deployed agent ID |
| `BACKEND_WEBHOOK_URL` | `https://your-worker.workers.dev` |

**Get Lambda ARN:**
At the top of the Lambda page, copy the ARN:
```
arn:aws:lambda:us-east-1:123456789:function:youplus-daily-call-trigger
```

| Variable | Value |
|----------|-------|
| `AWS_LAMBDA_FUNCTION_ARN` | `arn:aws:lambda:...` |

---

## 4. Trigger.dev Setup

### Create Account & Project
1. Go to https://trigger.dev
2. Create account
3. Create new project
4. Copy the project ID from the URL or settings

### Configure trigger.config.ts
Update the project ID in `backend/trigger.config.ts`:
```ts
export default defineConfig({
  project: "proj_your_project_id",
  // ...
});
```

### Set Environment Variables
In Trigger.dev dashboard > **Environment Variables**:

| Variable | Value | Description |
|----------|-------|-------------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Service role key |
| `CARTESIA_API_KEY` | `sk-...` | For voice cloning |
| `R2_ENDPOINT` | `https://xxx.r2.cloudflarestorage.com` | R2 endpoint |
| `R2_ACCESS_KEY_ID` | `...` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | `...` | R2 secret key |
| `R2_BUCKET_NAME` | `youplus-audio-recordings` | Bucket name |
| `BACKEND_URL` | `https://your-worker.workers.dev` | Backend URL |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | For schedule creation |
| `AWS_SECRET_ACCESS_KEY` | `...` | For schedule creation |
| `AWS_REGION` | `us-east-1` | AWS region |
| `AWS_LAMBDA_FUNCTION_ARN` | `arn:aws:lambda:...` | Lambda ARN |
| `AWS_SCHEDULER_ROLE_ARN` | `arn:aws:iam:...` | Scheduler role ARN |
| `AWS_SCHEDULE_GROUP_NAME` | `youplus-daily-calls` | Schedule group |

### Deploy Tasks
```bash
cd backend
npx trigger.dev deploy
```

---

## 5. Cartesia Agent Setup

### Create Account
1. Go to https://cartesia.ai
2. Sign up and get API key

### Get Credentials

| Variable | Where to find |
|----------|---------------|
| `CARTESIA_API_KEY` | Dashboard > API Keys |
| `CARTESIA_AGENT_ID` | After deploying agent (see below) |

### Deploy Agent
```bash
cd agent
cartesia auth login
cartesia deploy
```

After deployment, you'll get an Agent ID. Save it!

---

## 6. DodoPayments Setup

### Create Account
1. Go to https://dodopayments.com
2. Sign up for merchant account

### Get Credentials
From the dashboard:

| Variable | Value |
|----------|-------|
| `DODO_PAYMENTS_API_KEY` | API Key from dashboard |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | Webhook secret |
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` or `live_mode` |

### Configure Webhook
Set webhook URL to: `https://your-worker.workers.dev/webhook/dodopayments`

---

## 7. Vercel Setup (Frontend)

### Deploy
```bash
cd web
npx vercel
```

### Environment Variables
In Vercel dashboard > Settings > Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | `https://your-worker.workers.dev` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe/Dodo publishable key |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key (optional) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (optional) |

---

## 8. Optional Services

### PostHog (Analytics)
1. Go to https://posthog.com
2. Create project
3. Copy Project API Key

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_...` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` |

### Sentry (Error Monitoring)
1. Go to https://sentry.io
2. Create project (select Next.js and Node.js)
3. Copy DSN

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | `https://...@sentry.io/...` |
| `SENTRY_DSN` | Same DSN for backend |

---

## Complete Environment Variable Reference

### Backend (Cloudflare Worker)

Set via `wrangler secret put <NAME>`:

```bash
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Services
OPENAI_API_KEY=sk-...
CARTESIA_API_KEY=sk-...
CARTESIA_AGENT_ID=agent_...
GEMINI_API_KEY=...  # Optional

# Memory
SUPERMEMORY_API_KEY=sm_...  # Optional

# Payments
DODO_PAYMENTS_API_KEY=...
DODO_PAYMENTS_WEBHOOK_SECRET=...

# AWS Scheduling
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_LAMBDA_FUNCTION_ARN=arn:aws:lambda:...
AWS_SCHEDULER_ROLE_ARN=arn:aws:iam:...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...  # Optional

# Dev Only
DEBUG_ACCESS_TOKEN=...  # Optional
```

Already set in `wrangler.toml` (don't need to set):
```
ENVIRONMENT=production
BACKEND_URL=https://...
AWS_REGION=us-east-1
AWS_SCHEDULE_GROUP_NAME=youplus-daily-calls
DODO_PAYMENTS_ENVIRONMENT=test_mode
FRONTEND_URL=http://localhost:3000
```

---

### Trigger.dev

Set in Trigger.dev dashboard:

```bash
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Voice
CARTESIA_API_KEY=sk-...

# Storage (R2)
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=youplus-audio-recordings

# Backend
BACKEND_URL=https://your-worker.workers.dev

# AWS Scheduling
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_LAMBDA_FUNCTION_ARN=arn:aws:lambda:...
AWS_SCHEDULER_ROLE_ARN=arn:aws:iam:...
AWS_SCHEDULE_GROUP_NAME=youplus-daily-calls
```

---

### AWS Lambda

Set in Lambda console > Configuration > Environment variables:

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CARTESIA_API_KEY=sk-...
CARTESIA_AGENT_ID=agent_...
BACKEND_WEBHOOK_URL=https://your-worker.workers.dev
```

---

### Cartesia Agent

Set in `agent/.env`:

```bash
GEMINI_API_KEY=...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Same as SERVICE_ROLE_KEY
SUPERMEMORY_API_KEY=sm_...
BACKEND_URL=https://your-worker.workers.dev
```

---

### Frontend (Vercel)

Set in Vercel dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://your-worker.workers.dev
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=...
```

---

## Deployment Order

1. **Supabase** - Run migrations
2. **AWS** - Create IAM user, run setup script, deploy Lambda
3. **Cloudflare** - Deploy Worker with secrets
4. **Trigger.dev** - Set env vars, deploy tasks
5. **Cartesia** - Deploy agent
6. **Vercel** - Deploy frontend

---

## Testing Checklist

- [ ] Health check: `curl https://your-worker.workers.dev/`
- [ ] Supabase connection: Check `/stats` endpoint
- [ ] Onboarding flow: Complete onboarding in frontend
- [ ] Voice cloning: Check Cartesia dashboard for new voice
- [ ] Payment: Test checkout flow
- [ ] Daily call: Check EventBridge schedule was created
- [ ] Webhook: Verify call events are logged

---

## Troubleshooting

### "Missing environment variable" errors
Check that all secrets are set:
```bash
npx wrangler secret list
```

### AWS permission denied
Make sure the IAM user has `AdministratorAccess` or at minimum:
- `scheduler:*`
- `lambda:InvokeFunction`
- `iam:PassRole`

### Trigger.dev tasks not running
1. Check Trigger.dev dashboard for errors
2. Verify all env vars are set
3. Run `npx trigger.dev dev` locally to test

### Cartesia calls not working
1. Verify `CARTESIA_AGENT_ID` is correct
2. Check agent is deployed: `cartesia list`
3. Test manually: `cartesia call +1XXXXXXXXXX`
