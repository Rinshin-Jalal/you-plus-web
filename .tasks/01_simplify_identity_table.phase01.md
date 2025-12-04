# Task 01: Simplify Identity Table

## Objective

Remove all psychological/onboarding data from the identity table. Keep only what Supermemory cannot handle (scheduling, voice cloning).

## Current Schema (Too Much)

```sql
CREATE TABLE identity (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES users(id),
  name text NOT NULL,
  daily_commitment text NOT NULL,
  call_time time NOT NULL,
  cartesia_voice_id text,
  why_it_matters_audio_url text,
  cost_of_quitting_audio_url text,
  commitment_audio_url text,
  onboarding_context jsonb,  -- 20+ fields of psychological data
  created_at timestamptz,
  updated_at timestamptz
);
```

## New Schema (Minimal)

```sql
CREATE TABLE identity (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES users(id),
  
  -- Scheduling (Supermemory can't schedule calls)
  daily_commitment text NOT NULL,
  call_time time NOT NULL,
  timezone text DEFAULT 'UTC',
  
  -- Voice cloning (needs actual voice ID)
  cartesia_voice_id text,
  
  -- Supermemory link
  supermemory_container_id text,  -- Their container tag in Supermemory
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Migration SQL

```sql
-- migrations/006_simplify_identity.sql

-- 1. Add new column for Supermemory reference
ALTER TABLE identity 
ADD COLUMN IF NOT EXISTS supermemory_container_id text;

-- 2. Add timezone if not exists (useful for call scheduling)
ALTER TABLE identity 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- 3. For existing users, set supermemory_container_id to user_id
-- (We'll use user_id as the container tag in Supermemory)
UPDATE identity 
SET supermemory_container_id = user_id::text
WHERE supermemory_container_id IS NULL;

-- 4. Move audio URLs to new voice_samples table (see task 06)
-- For now, keep them but mark as deprecated

-- 5. Drop onboarding_context column (AFTER migrating data to Supermemory)
-- NOTE: Don't run this until task 03 is complete!
-- ALTER TABLE identity DROP COLUMN IF EXISTS onboarding_context;

-- 6. Drop audio URL columns (AFTER task 06)
-- ALTER TABLE identity DROP COLUMN IF EXISTS why_it_matters_audio_url;
-- ALTER TABLE identity DROP COLUMN IF EXISTS cost_of_quitting_audio_url;
-- ALTER TABLE identity DROP COLUMN IF EXISTS commitment_audio_url;

-- 7. Name is in users table, remove from identity
-- ALTER TABLE identity DROP COLUMN IF EXISTS name;
```

## Breaking Changes

| Field Removed | Where It Goes |
|--------------|---------------|
| `onboarding_context` | Supermemory memories |
| `name` | Already in `users.name` |
| `*_audio_url` | New `voice_samples` table |

## Agent Code Changes Required

After this migration, the agent must NOT do:
```python
# OLD (will break)
identity = user_context.get("identity", {})
onboarding = identity.get("onboarding_context", {})
goal = onboarding.get("goal", "")
```

Instead:
```python
# NEW
profile = await supermemory.get_profile(user_id)
# profile already contains goal, favorite_excuse, etc.
```

## Rollback Plan

Keep `onboarding_context` column during transition. Only drop after:
1. All existing users migrated to Supermemory
2. Agent confirmed working with Supermemory
3. 7 days of successful operation

## Files to Update After Migration

- [ ] `agent/core/config.py` - Remove onboarding_context extraction
- [ ] `agent/docs/database.sql` - Update schema docs
- [ ] `old-backend-for-swift/src/features/onboarding/handlers/conversion-complete.ts` - Stop writing to onboarding_context

## Testing

1. Create test user
2. Complete onboarding
3. Verify data in Supermemory (not in identity table)
4. Run a call
5. Verify agent has full context

---

**Status: PENDING**
**Depends on: None**
**Blocks: Tasks 03, 04**
