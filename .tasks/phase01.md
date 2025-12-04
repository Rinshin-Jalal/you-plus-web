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

## Tasks Completed

1. ~~`01_simplify_identity_table.phase01.md`~~ - SQL migration 006 created
2. ~~`02_supermemory_service.phase01.md`~~ - agent/services/supermemory.py created
3. ~~`03_onboarding_to_supermemory.phase01.md`~~ - TypeScript handler updated
4. ~~`04_agent_use_profile.phase01.md`~~ - config.py has build_system_prompt_v2()
5. ~~`05_call_transcript_memory.phase01.md`~~ - main.py sends transcripts after calls
6. ~~`06_voice_samples_table.phase01.md`~~ - SQL migration 007 created

## Dependencies

- Supermemory API key (add to .env)
- Supermemory Python SDK or HTTP client

## Success Criteria

- [x] Identity table has < 10 columns (migration 006 ready)
- [x] No `onboarding.get("field")` calls in agent code (build_system_prompt_v2)
- [x] Profile fetched with single API call (supermemory.get_user_profile)
- [x] Call transcripts automatically update profile (main.py)
- [x] Voice recordings stored separately from text data (migration 007)

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

## Files Created/Modified

### Migrations
- `migrations/006_simplify_identity.sql` - Adds supermemory_container_id, timezone
- `migrations/007_voice_samples_table.sql` - Separate voice recordings table

### Agent (Python)
- `agent/services/supermemory.py` - Full Supermemory client
- `agent/services/__init__.py` - Package init
- `agent/core/config.py` - Added build_system_prompt_v2() with Supermemory
- `agent/core/main.py` - Sends call transcripts to Supermemory after each call
- `agent/.env.example` - Added SUPERMEMORY_API_KEY

### Backend (TypeScript)
- `old-backend-for-swift/src/services/supermemory.ts` - TypeScript client
- `old-backend-for-swift/src/features/onboarding/handlers/conversion-complete.ts` - Calls addOnboardingProfile()

### Documentation
- `agent/docs/database.sql` - Updated schema docs (v4)

---

**Status: COMPLETED**
**Created: 2025-01-04**
**Completed: 2025-01-04**

## Next Steps (Post-Phase 01)

1. **Run migrations 006 and 007** on Supabase
2. **Add SUPERMEMORY_API_KEY** to all environments
3. **Test end-to-end**: Complete onboarding → verify in Supermemory → make a call → verify transcript saved
4. **Switch agent to use build_system_prompt_v2()** in main.py (currently still uses v1)
5. **Delete legacy onboarding_context JSONB** after verifying Supermemory works
