# Super MVP Database Redesign - Migration Summary

**Version**: 2.0.0-super-mvp
**Date**: 2025-11-04
**Status**: Ready for execution

## 🎯 Key Decision: NO conversion_onboarding Table

**Old Approach (Rejected)**:
- 25-column `conversion_onboarding` table with explicit fields for every onboarding detail
- Bloated, redundant storage of data that's only used once for AI context

**New Approach (Super MVP)**:
- ALL onboarding data stored in simplified `identity` table
- Core fields (used in app logic) → explicit columns
- Context fields (used for AI personalization) → single JSONB column

## 📊 Database Schema Changes

### Identity Table (12 columns)

**Explicit Columns** (used in app logic):
```sql
name                        TEXT NOT NULL
daily_commitment            TEXT NOT NULL
chosen_path                 TEXT NOT NULL ('hopeful' or 'doubtful')
call_time                   TIME NOT NULL
strike_limit                INT NOT NULL (1-5)
```

**Voice URLs** (for AI calls):
```sql
why_it_matters_audio_url    TEXT
cost_of_quitting_audio_url  TEXT
commitment_audio_url        TEXT
```

**JSONB Context** (for AI personalization):
```sql
onboarding_context          JSONB
```

**Example JSONB Structure**:
```json
{
  "goal": "Get fit and lose 20 pounds by June 2025",
  "motivation_level": 8,
  "attempt_history": "Failed 3 times. Last time gave up after 2 weeks.",
  "favorite_excuse": "Too busy with work",
  "who_disappointed": "My kids and myself",
  "quit_pattern": "Usually quits 2 weeks in",
  "future_if_no_change": "Overweight, unhappy, watching life pass by",
  "witness": "My spouse",
  "will_do_this": true,
  "permissions": {
    "notifications": true,
    "calls": true
  },
  "completed_at": "2025-01-15T10:30:00Z",
  "time_spent_minutes": 20
}
```

### Other Tables

**status** (7 columns):
- current_streak_days
- total_calls_completed
- last_call_at

**promises** (8 columns):
- promise_text
- due_date
- completed
- completed_at

**users** (cleaned up):
- Dropped: voice_clone_id, schedule_change_count, voice_reclone_count
- Kept: onboarding_completed, call_window_start, call_window_timezone, subscription_status, push_token

## 🗑️ Dropped Tables

1. **brutal_reality** - Feature removed
2. **memory_embeddings** - Vector search removed
3. **onboarding_response_v3** - Never used
4. **onboarding** (old JSONB) - Replaced by identity.onboarding_context

## 🔄 Backend API Changes

### Endpoint: `/api/onboarding/conversion/complete`

**Old Flow**:
1. Upload 3 voice recordings → R2
2. Insert into `conversion_onboarding` table (25 columns)
3. Trigger creates `identity` record from conversion data

**New Flow**:
1. Upload 3 voice recordings → R2
2. Build `onboarding_context` JSONB object
3. Insert directly into `identity` table (12 columns)
4. Trigger auto-creates `status` record
5. Update users.onboarding_completed = true

**Response Changes**:
```json
{
  "success": true,
  "message": "Conversion onboarding completed successfully",
  "completedAt": "2025-01-15T10:30:00Z",
  "voiceUploads": {
    "whyItMatters": "https://audio.yourbigbruhh.app/audio/...",
    "costOfQuitting": "https://audio.yourbigbruhh.app/audio/...",
    "commitment": "https://audio.yourbigbruhh.app/audio/..."
  },
  "identity": {
    "created": true,
    "core_fields": ["name", "daily_commitment", "chosen_path", "call_time", "strike_limit"],
    "voice_urls": 3,
    "context_fields": 13
  },
  "identityStatusCreated": true
}
```

## 📱 iOS Changes Required

**NO CHANGES NEEDED** for:
- ConversionOnboardingService.swift
- ProcessingView.swift
- Request payload structure

The iOS app already sends all the required data. The backend now organizes it differently internally, but the API contract remains the same.

## 🔍 Benefits

1. **Simplicity**: 12 columns vs 25 columns
2. **Flexibility**: JSONB allows easy addition of context fields without schema changes
3. **Performance**: GIN index on JSONB for fast AI context queries
4. **Clarity**: Clear separation between app logic fields and AI context
5. **No Bloat**: No separate conversion_onboarding table cluttering the schema

## 🚀 Migration Steps

1. **Backup Database**
   ```bash
   # In Supabase Dashboard: Database → Backups → Create Backup
   ```

2. **Run Migration**
   ```bash
   # In Supabase SQL Editor:
   # Copy contents of be/sql/complete-mvp-redesign.sql
   # Click "Run"
   ```

3. **Verify Success**
   ```sql
   -- Should show 4 tables
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('identity', 'status', 'promises', 'users');

   -- Check identity structure
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name = 'identity';
   ```

4. **Deploy Backend**
   ```bash
   cd be
   npm run deploy
   ```

5. **Test Full Flow**
   - Complete onboarding
   - Pay via RevenueCat
   - Sign up via Supabase
   - ProcessingView uploads data
   - Verify identity + status created
   - Check onboarding_context JSONB populated

## 📋 Post-Migration Cleanup

**Backend Code Updates**:
- Remove references to `conversion_onboarding` table
- Update identity extraction to use `identity.onboarding_context` JSONB
- Update AI prompt generation to query JSONB fields

**Queries for AI Context**:
```sql
-- Get goal from JSONB
SELECT onboarding_context->>'goal' as goal FROM identity WHERE user_id = ?;

-- Get motivation level
SELECT (onboarding_context->>'motivation_level')::int as motivation FROM identity WHERE user_id = ?;

-- Get full context
SELECT onboarding_context FROM identity WHERE user_id = ?;
```

## ✅ Success Criteria

- [ ] Migration runs without errors
- [ ] 4 bloat tables dropped
- [ ] Identity table has 12 columns
- [ ] status table exists with 7 columns
- [ ] Backend endpoint creates identity record
- [ ] Trigger auto-creates status
- [ ] JSONB context properly populated
- [ ] Voice URLs stored correctly
- [ ] User marked as onboarding_completed
- [ ] Full iOS → Backend → Database flow works

## 🔗 Related Files

- **Migration SQL**: `/be/sql/complete-mvp-redesign.sql`
- **Backend Endpoint**: `/be/src/features/onboarding/handlers/conversion-complete.ts`
- **iOS Service**: `/swift/bigbruhh/Features/Onboarding/Services/ConversionOnboardingService.swift`
- **Processing View**: `/swift/bigbruhh/Features/Onboarding/Views/ProcessingView.swift`

---

**Ready to migrate!** 🚀
