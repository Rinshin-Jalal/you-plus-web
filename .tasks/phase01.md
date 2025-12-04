# Phase 01: Dynamic Identity with Supermemory

## Overview

Rearchitect the identity system to use Supermemory for dynamic, evolving user profiles instead of static JSONB storage. The agent should never manually extract fields - Supermemory provides the context automatically.

## Goals

1. **Simplify identity table** - Only store what Supermemory can't handle (scheduling, voice cloning)
2. **Integrate Supermemory** - Use their Memory API + User Profiles for all psychological data
3. **No hardcoding** - Agent uses profile directly, no field-by-field extraction
4. **Evolution** - Profile grows with each call, not frozen at onboarding
5. **Voice handling** - Separate storage for audio files, text transcripts to Supermemory

## Architecture Change

```
BEFORE:
┌─────────────────────────────────────────────────────────────┐
│ identity table                                               │
│ ├── onboarding_context JSONB (20+ fields)                   │
│ ├── why_it_matters_audio_url                                │
│ └── ... manual extraction in agent                          │
└─────────────────────────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────────────────────────┐
│ identity table (minimal)                                     │
│ ├── daily_commitment                                        │
│ ├── call_time                                               │
│ ├── cartesia_voice_id                                       │
│ └── supermemory_container_id                                │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Supermemory                                                  │
│ ├── User Profile (static + dynamic)                         │
│ ├── Onboarding memories                                     │
│ ├── Call transcripts                                        │
│ └── Evolving psychological insights                         │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ voice_samples table (separate)                               │
│ ├── audio_url (for Cartesia cloning)                        │
│ └── transcript (text sent to Supermemory)                   │
└─────────────────────────────────────────────────────────────┘
```

## Tasks in This Phase

1. `01_simplify_identity_table.phase01.md` - SQL migration to slim down identity
2. `02_supermemory_service.phase01.md` - Create agent/services/supermemory.py
3. `03_onboarding_to_supermemory.phase01.md` - Push onboarding data to Supermemory
4. `04_agent_use_profile.phase01.md` - Update config.py to use Supermemory profile
5. `05_call_transcript_memory.phase01.md` - Send call transcripts to Supermemory
6. `06_voice_samples_table.phase01.md` - Separate voice storage from identity

## Dependencies

- Supermemory API key (add to .env)
- Supermemory Python SDK or HTTP client

## Success Criteria

- [ ] Identity table has < 10 columns
- [ ] No `onboarding.get("field")` calls in agent code
- [ ] Profile fetched with single API call
- [ ] Call transcripts automatically update profile
- [ ] Voice recordings stored separately from text data

## Supermemory Integration Points

| Operation | When | What |
|-----------|------|------|
| Add memory | Onboarding complete | Full psychological profile as text |
| Add memory | After each call | Call transcript + outcomes |
| Get profile | Before each call | User's static + dynamic context |
| Search | When needed | Specific memories (e.g., past excuses) |

## Environment Variables Needed

```bash
SUPERMEMORY_API_KEY=sm_...
SUPERMEMORY_ORG_ID=org_...  # Optional, for team accounts
```

---

**Status: IN PROGRESS**
**Created: 2025-01-04**
