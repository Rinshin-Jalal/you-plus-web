# YOU+ Deployment Guide

Complete guide to deploying all YOU+ services and configuring environment variables.

---

## Architecture Overview

```
                                    YOU+ ARCHITECTURE
                                    
    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │   NEXT.JS WEB   │     │   CF WORKER     │     │  CARTESIA AGENT │
    │  (CF Pages)     │────▶│   (Cloudflare)  │────▶│  (Cartesia)     │
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
| Cloudflare | Worker API, Pages & R2 Storage | https://cloudflare.com |
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
npx wrangler secret put BEDROCK_API_KEY
npx wrangler secret put BEDROCK_REGION
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

## 3. AWS Bedrock Setup (AI/LLM)

### 3.1 Generate Bedrock API Key

1. Go to https://console.aws.amazon.com/bedrock/
2. Navigate to **API keys** in the left sidebar
3. Click **Create API key**
4. Give it a name (e.g., `youplus-bedrock-key`)
5. Copy the API key immediately (you won't be able to see it again)

| Variable | Value |
|----------|-------|
| `BEDROCK_API_KEY` | Your Bedrock API key |
| `BEDROCK_REGION` | AWS region (e.g., `us-west-2`) |

**Note:** Bedrock uses the OpenAI-compatible API format, so we use the same `openai` npm package but configure it to point to Bedrock's endpoint.

### 3.2 Supported Models

Bedrock supports various OpenAI-compatible models. The default model used is `openai.gpt-oss-20b-1:0`. You can check available models in your region via the AWS Bedrock console.

### 3.3 Agent Configuration (Python)

The Python agent uses the same Bedrock configuration. Set these environment variables:

```bash
# Required
BEDROCK_API_KEY=...  # Your Bedrock API key
BEDROCK_REGION=us-west-2  # AWS region

# Optional (defaults shown)
BEDROCK_MODEL=openai.gpt-oss-20b-1:0  # Model to use
```

**Legacy Support:** The agent will automatically fall back to `LLM_API_KEY`, `LLM_BASE_URL`, and `LLM_MODEL` if `BEDROCK_*` variables are not set, but you should migrate to the new `BEDROCK_*` variables.

---

## 4. AWS Setup (Daily Call Scheduling)

### 4.1 Create IAM User for CLI

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

### 4.2 Configure AWS CLI
```bash
aws configure
# Enter: Access Key ID, Secret Key, us-east-1, json
```

### 4.3 Run Infrastructure Setup
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

### 4.4 Deploy Lambda Function

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

## 5. Trigger.dev Setup

**What Trigger.dev does:** Runs heavy background jobs that would timeout on Cloudflare Workers. The main job is `process-onboarding` which transcribes audio, clones voices, uploads to R2, saves to database, and creates AWS schedules.

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

**Required - Database Access:**
| Variable | Value | Used For |
|----------|-------|----------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Save onboarding data, update job status |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Full database access for background jobs |

**Required - Voice Processing:**
| Variable | Value | Used For |
|----------|-------|----------|
| `CARTESIA_API_KEY` | `sk-...` | Transcribe audio recordings + clone user's voice |

**Required - Audio Storage:**
| Variable | Value | Used For |
|----------|-------|----------|
| `R2_ENDPOINT` | `https://xxx.r2.cloudflarestorage.com` | Upload recordings to R2 (via S3 API) |
| `R2_ACCESS_KEY_ID` | `...` | R2 authentication |
| `R2_SECRET_ACCESS_KEY` | `...` | R2 authentication |
| `R2_BUCKET_NAME` | `youplus-audio-recordings` | Target bucket for uploads |
| `BACKEND_URL` | `https://your-worker.workers.dev` | Generate public URLs for recordings |

**Required - Daily Call Scheduling:**
| Variable | Value | Used For |
|----------|-------|----------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | Create EventBridge schedules |
| `AWS_SECRET_ACCESS_KEY` | `...` | AWS authentication |
| `AWS_LAMBDA_FUNCTION_ARN` | `arn:aws:lambda:...` | Target for scheduled calls |
| `AWS_SCHEDULER_ROLE_ARN` | `arn:aws:iam:...` | IAM role for EventBridge |

**Optional - Defaults Available:**
| Variable | Default | Used For |
|----------|---------|----------|
| `AWS_REGION` | `us-east-1` | AWS region for EventBridge |
| `AWS_SCHEDULE_GROUP_NAME` | `youplus-daily-calls` | Schedule group name |

### Deploy Tasks
```bash
cd backend
npx trigger.dev deploy
```

---

## 6. Cartesia Agent Setup (Python Voice Agent)

**What the agent does:** This is the Python voice agent that makes the actual phone calls to users. It runs on Cartesia's infrastructure and uses AI (Bedrock) to have conversations.

### Create Account
1. Go to https://cartesia.ai
2. Sign up and get API key
3. From Dashboard > API Keys, copy your API key

### Configure Environment Variables

Create `.env` file in the `agent/` directory:

```bash
cd agent
touch .env
```

Edit `agent/.env` with the following variables:

**Required Variables:**
```bash
# AI/LLM - Powers the conversation
BEDROCK_API_KEY=...  # AWS Bedrock API key from AWS Console
BEDROCK_REGION=us-west-2  # AWS region

# Database - User data and call history
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Same as SUPABASE_SERVICE_ROLE_KEY

# Backend - Webhooks and logging
BACKEND_URL=https://your-worker.workers.dev
```

**Optional Variables:**
```bash
# Model selection (defaults to openai.gpt-oss-20b-1:0)
BEDROCK_MODEL=openai.gpt-oss-20b-1:0

# Advanced memory system (optional)
SUPERMEMORY_API_KEY=sm_...
```

**Note:** The agent also supports legacy `LLM_*` environment variables for backward compatibility, but you should use `BEDROCK_*` for new deployments.

### Install Dependencies (if testing locally)

This project uses `uv` for dependency management (defined in `pyproject.toml`):

```bash
cd agent

# Install uv if you don't have it
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Or use the venv that's already there
source path/to/venv/bin/activate
```

### Deploy Agent

```bash
cd agent

# Login to Cartesia
cartesia auth login

# Deploy the agent
cartesia deploy

# Save the Agent ID shown after deployment!
```

After deployment, you'll get an `CARTESIA_AGENT_ID` like `agent_abc123`. Save this for:
- Backend worker configuration
- Lambda function configuration

### Test Agent Locally (optional)

```bash
cd agent
python main.py
# Or test a call flow:
python tests/test_local.py
```

---

## 7. DodoPayments Setup

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

## 8. Frontend Deployment (Next.js)

Uses OpenNext.js to deploy Next.js to Cloudflare Workers.

### Deploy Commands

```bash
cd web

# Test locally with Cloudflare runtime
npm run preview

# Deploy to Cloudflare Workers
npm run deploy
```

### Environment Variables

Set in Cloudflare Pages dashboard or via `wrangler secret`:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Your backend URL |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog key (optional) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` |

---

## 9. Optional Services

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
BEDROCK_API_KEY=...  # AWS Bedrock API key (OpenAI-compatible)
BEDROCK_REGION=us-west-2  # AWS Bedrock region
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

Set in Trigger.dev dashboard. All variables below are used by the `process-onboarding` task which:
1. Transcribes audio recordings (needs Cartesia)
2. Clones user's voice (needs Cartesia)
3. Uploads recordings to storage (needs R2)
4. Saves to database (needs Supabase)
5. Creates daily call schedule (needs AWS)

```bash
# Database - Save onboarding data
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Voice - Transcribe + clone voice
CARTESIA_API_KEY=sk-...

# Storage - Upload recordings to R2 via S3 API
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=youplus-audio-recordings

# Backend - Generate public URLs
BACKEND_URL=https://your-worker.workers.dev

# AWS - Create EventBridge schedule for daily calls
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1  # Optional, defaults to us-east-1
AWS_LAMBDA_FUNCTION_ARN=arn:aws:lambda:...
AWS_SCHEDULER_ROLE_ARN=arn:aws:iam:...
AWS_SCHEDULE_GROUP_NAME=youplus-daily-calls  # Optional, has default
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

### Cartesia Agent (Python)

Set in `agent/.env` file. The agent needs these to:
1. Make AI-powered conversations (Bedrock)
2. Fetch user data from database (Supabase)
3. Send call results to backend (Backend URL)

```bash
# Required - AI for conversations
BEDROCK_API_KEY=...  # AWS Bedrock API key
BEDROCK_REGION=us-west-2  # AWS region

# Required - Database access
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Same as SERVICE_ROLE_KEY

# Required - Backend webhooks
BACKEND_URL=https://your-worker.workers.dev

# Optional - Advanced features
BEDROCK_MODEL=openai.gpt-oss-20b-1:0  # Has default
SUPERMEMORY_API_KEY=sm_...  # For advanced memory system
```

---

### Frontend (Cloudflare Pages)

Set in Cloudflare Pages dashboard:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://your-worker.workers.dev

# Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Optional - Analytics & Monitoring
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
3. **Cloudflare Worker** - Deploy backend with secrets
4. **Trigger.dev** - Set env vars, deploy tasks
5. **Cartesia** - Deploy agent
6. **Cloudflare Pages** - Deploy frontend with OpenNext.js

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
