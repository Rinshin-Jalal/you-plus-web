# YOU+ (YouPlus)

An AI-powered accountability app where your "Future Self" calls you daily to keep you on track with your goals.

## How It Works

1. **Onboarding**: User defines their Future Self identity, goals, and records voice samples
2. **Voice Cloning**: We clone the user's voice using Cartesia AI
3. **Daily Calls**: At the user's preferred time, their Future Self calls them
4. **Accountability**: The AI knows their goals, tracks streaks, and adapts based on performance

---

## Project Structure

```
youplus-web/
├── web/                    # Next.js frontend (Vercel)
├── backend/                # Hono API on Cloudflare Workers
├── agent/                  # Cartesia Line voice agent (Python)
├── lambda/                 # AWS Lambda for daily call triggers
│   └── daily-call-trigger/
├── infrastructure/         # AWS setup scripts
├── migrations/             # Supabase database migrations
├── scripts/                # Utility scripts
└── specs/                  # Product specifications
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15, React, TailwindCSS | Web app UI |
| **Backend API** | Hono, Cloudflare Workers | REST API, webhooks |
| **Database** | Supabase (PostgreSQL) | Users, goals, call logs |
| **Storage** | Cloudflare R2 | Voice recordings |
| **Voice AI** | Cartesia Line SDK | STT, TTS, voice cloning, calls |
| **Background Jobs** | Trigger.dev | Onboarding processing |
| **Scheduling** | AWS EventBridge + Lambda | Per-user daily call schedules |
| **Payments** | DodoPayments | Subscriptions |
| **Analytics** | PostHog | User analytics, feature flags |
| **Monitoring** | Sentry | Error tracking |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                   │
└─────────────────────────────────────────────────────────────────────────┘

  User visits web app          User completes onboarding      Daily at preferred time
         │                              │                              │
         ▼                              ▼                              ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│   NEXT.JS WEB   │           │   TRIGGER.DEV   │           │  AWS EVENTBRIDGE│
│   (Vercel)      │           │   (Background)  │           │  (Scheduler)    │
│                 │           │                 │           │                 │
│ • Onboarding UI │           │ • Transcribe    │           │ • Per-user      │
│ • Dashboard     │           │ • Clone voice   │           │   schedules     │
│ • Settings      │           │ • Upload to R2  │           │ • Timezone      │
│ • Payments      │           │ • Save to DB    │           │   aware         │
└────────┬────────┘           │ • Create AWS    │           └────────┬────────┘
         │                    │   schedule      │                    │
         │                    └─────────────────┘                    │
         │                                                           │
         ▼                                                           ▼
┌─────────────────┐                                         ┌─────────────────┐
│  CF WORKER API  │◀────────────────────────────────────────│  AWS LAMBDA     │
│  (Cloudflare)   │                                         │                 │
│                 │           ┌─────────────────┐           │ • Validate user │
│ • REST API      │           │    SUPABASE     │           │ • Check called  │
│ • Auth          │◀─────────▶│   (Database)    │◀──────────│   today         │
│ • Webhooks      │           │                 │           │ • Trigger call  │
│ • Schedule mgmt │           │ • Users         │           └────────┬────────┘
└─────────────────┘           │ • Future Self   │                    │
                              │ • Call logs     │                    │
                              │ • Subscriptions │                    ▼
                              └─────────────────┘           ┌─────────────────┐
                                                            │ CARTESIA AGENT  │
                              ┌─────────────────┐           │                 │
                              │  CLOUDFLARE R2  │           │ • Voice AI      │
                              │   (Storage)     │           │ • Cloned voice  │
                              │                 │           │ • Outbound call │
                              │ • Voice samples │           │ • Conversation  │
                              │ • Recordings    │           └─────────────────┘
                              └─────────────────┘                    │
                                                                     ▼
                                                               📞 User's Phone
```

---

## Quick Start (Development)

### Prerequisites

- Node.js 20+
- Python 3.11+ (for agent)
- [Bun](https://bun.sh) or npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Cartesia CLI](https://docs.cartesia.ai/line/overview)
- AWS CLI (for scheduling)

### 1. Clone & Install

```bash
git clone <repo-url>
cd youplus-web

# Install frontend dependencies
cd web && npm install

# Install backend dependencies
cd ../backend && npm install

# Install agent dependencies
cd ../agent && uv sync  # or pip install -r requirements.txt
```

### 2. Set Up Environment Variables

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete environment variable reference.

**Quick local setup:**

```bash
# Frontend
cp web/.env.example web/.env.local
# Edit with your Supabase keys

# Agent
cp agent/.env.example agent/.env
# Edit with your API keys
```

### 3. Run Development Servers

```bash
# Terminal 1: Frontend
cd web && npm run dev

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Agent (for testing)
cd agent && uv run python tests/test_local.py
```

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

### Deployment Order

1. **Supabase** - Run migrations
2. **AWS** - Create IAM user, run setup script, deploy Lambda
3. **Cloudflare** - Deploy Worker with secrets
4. **Trigger.dev** - Set env vars, deploy tasks
5. **Cartesia** - Deploy agent
6. **Vercel** - Deploy frontend

### Quick Deploy Commands

```bash
# Backend (Cloudflare Worker)
cd backend && npx wrangler deploy

# Frontend (Vercel)
cd web && npx vercel --prod

# Agent (Cartesia)
cd agent && cartesia deploy

# Background Jobs (Trigger.dev)
cd backend && npx trigger.dev deploy
```

---

## Key Features

### Future Self System
- Users define their ideal future self
- Select life pillars (fitness, career, relationships, etc.)
- Record voice for cloning
- AI embodies their future self during calls

### Daily Accountability Calls
- Per-user scheduling with timezone support
- AWS EventBridge for precise timing
- Cartesia for natural voice conversations
- Streak tracking and gamification

### Voice AI
- Voice cloning from ~30 seconds of audio
- Speech-to-text via Cartesia Ink
- Text-to-speech via Cartesia Sonic
- Real-time conversation with Cartesia Line

### Gamification
- Daily streaks with milestone rewards
- Trust score based on kept promises
- Mascot evolution (planned)

---

## API Endpoints

### Core
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/stats` | Service stats |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/core/profile` | Get user profile |
| PUT | `/api/core/profile` | Update profile |
| DELETE | `/api/core/profile` | Delete account |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/schedule` | Get call schedule |
| PUT | `/api/settings/schedule` | Update call time |
| GET | `/api/settings/phone` | Get phone number |
| PUT | `/api/settings/phone` | Update phone |

### Onboarding
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/onboarding/conversion/complete` | Complete onboarding |
| GET | `/api/onboarding/returning` | Get returning user data |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/billing/checkout/create` | Create checkout session |
| GET | `/api/billing/subscription` | Get subscription status |
| GET | `/api/billing/plans` | Get available plans |
| POST | `/api/billing/cancel` | Cancel subscription |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook/dodopayments` | Payment events |
| POST | `/webhook/call/completed` | Call completed |
| POST | `/webhook/call/started` | Call started |
| POST | `/webhook/call/missed` | Call missed |

---

## Database Schema

### Core Tables

```sql
-- Users
users (
  id uuid PRIMARY KEY,
  email text,
  name text,
  phone_number text,
  call_time time,
  timezone text,
  onboarding_completed boolean,
  subscription_status text
)

-- Future Self definition
future_self (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  core_identity text,
  primary_pillar text,
  the_why text,
  dark_future text,
  cartesia_voice_id text
)

-- Life pillars (goals)
future_self_pillars (
  id uuid PRIMARY KEY,
  user_id uuid,
  pillar text,
  current_state text,
  future_state text,
  priority integer
)

-- Call tracking
call_analytics (
  id uuid PRIMARY KEY,
  user_id uuid,
  call_type text,
  duration_seconds integer,
  promise_made text,
  promise_kept boolean
)

-- Streaks & stats
status (
  user_id uuid PRIMARY KEY,
  current_streak_days integer,
  longest_streak_days integer,
  total_calls_completed integer
)
```

---

## Development

### Running Tests

```bash
# Backend
cd backend && npm test

# Agent
cd agent && uv run pytest

# Frontend
cd web && npm test
```

### Code Structure

**Frontend (`/web`):**
- `/src/app` - Next.js app router pages
- `/src/components` - React components
- `/src/hooks` - Custom React hooks
- `/src/services` - API clients
- `/src/stores` - Zustand stores

**Backend (`/backend`):**
- `/src/features` - Feature modules (core, billing, webhook)
- `/src/services` - Shared services (scheduler)
- `/src/middleware` - Auth, security middleware
- `/src/events` - Event-driven handlers
- `/src/trigger` - Trigger.dev background tasks

**Agent (`/agent`):**
- `/agents` - AI agent definitions
- `/conversation` - Call flow logic
- `/core` - LLM and handler setup
- `/services` - External service integrations

---

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Run tests
4. Submit PR

---

## License

Proprietary - All rights reserved

---

## Support

For issues or questions, open a GitHub issue.
