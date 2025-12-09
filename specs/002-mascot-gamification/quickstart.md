# Quickstart: Mascot Gamification Development

**Feature**: 002-mascot-gamification  
**Date**: 2025-12-09

---

## Prerequisites

- Node.js 18+
- PostgreSQL (via Supabase local or cloud)
- Cloudflare Wrangler CLI
- pnpm or npm

---

## Quick Setup

### 1. Run the Database Migration

```bash
# Apply the gamification migration to your Supabase instance
supabase db push

# Or run directly:
psql $DATABASE_URL -f migrations/012_gamification_system.sql
```

### 2. Start the Backend

```bash
cd backend

# Install dependencies
npm install

# Start dev server
npm run dev

# Backend runs at http://localhost:8787
```

### 3. Start the Frontend

```bash
cd web

# Install dependencies  
npm install

# Start dev server
npm run dev

# Frontend runs at http://localhost:3000
```

---

## API Testing

### Test Progression Endpoint

```bash
# Get user progression
curl -X GET http://localhost:8787/api/gamification/progression \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response:
```json
{
  "xp": {
    "total": 0,
    "current_level": 1,
    "xp_in_level": 0,
    "xp_to_next": 100,
    "progress_percent": 0
  },
  "streak": {
    "current": 0,
    "longest": 0,
    "multiplier": 1.0,
    "shields_available": 0
  },
  "mascot": {
    "stage": 1,
    "stage_name": "Spark",
    "mood": "neutral",
    "energy": 100
  }
}
```

### Test Achievement Listing

```bash
curl -X GET http://localhost:8787/api/gamification/achievements \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Test Mascot Customization

```bash
# Equip an accessory
curl -X POST http://localhost:8787/api/gamification/accessories/sunglasses/equip \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## Database Verification

### Check Tables Created

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%achievement%' 
   OR table_name LIKE '%progression%'
   OR table_name LIKE '%accessory%'
   OR table_name LIKE '%challenge%'
   OR table_name LIKE '%leaderboard%'
   OR table_name LIKE '%xp%';
```

Expected tables:
- `user_progression`
- `achievements`
- `user_achievements`
- `xp_transactions`
- `daily_challenges`
- `mascot_accessories`
- `user_accessories`
- `weekly_leaderboard`

### Check Seed Data

```sql
-- Check achievements seeded
SELECT COUNT(*) as achievement_count FROM achievements;
-- Expected: 45

-- Check accessories seeded
SELECT COUNT(*) as accessory_count FROM mascot_accessories;
-- Expected: 25

-- Check achievement categories
SELECT category, COUNT(*) FROM achievements GROUP BY category;
```

---

## Testing XP Award Flow

### Simulate Pillar Check-in

```sql
-- Create test user progression if not exists
INSERT INTO user_progression (user_id)
VALUES ('your-user-uuid')
ON CONFLICT (user_id) DO NOTHING;

-- Simulate XP award (what the backend does)
INSERT INTO xp_transactions (user_id, amount, base_amount, reason, multiplier)
VALUES ('your-user-uuid', 15, 15, 'pillar_checkin', 1.0);

UPDATE user_progression
SET total_xp = total_xp + 15,
    xp_in_current_level = xp_in_current_level + 15,
    last_xp_earned_at = NOW()
WHERE user_id = 'your-user-uuid';
```

### Verify Level Calculation

```sql
SELECT * FROM calculate_level(1750);
-- Expected: level=10, xp_in_level=~50, xp_to_next=~405
```

---

## Frontend Component Testing

### View Mascot Component

Navigate to: `http://localhost:3000/dashboard`

The mascot should appear with:
- Stage 1 (Spark) appearance
- Neutral mood animation
- No accessories (unless unlocked)

### Trigger Level Up (Dev Mode)

In browser console:
```javascript
// Simulate level up for testing UI
window.__DEV_GAMIFICATION__ = { forceLevelUp: true };
```

---

## Running Tests

### Backend Tests

```bash
cd backend
npm test

# Run specific test
npm test -- xp-engine.test.ts
npm test -- level-calculator.test.ts
npm test -- achievement-checker.test.ts
```

### Frontend Tests

```bash
cd web
npm test

# Run specific component tests
npm test -- MascotAvatar.test.tsx
npm test -- XPBar.test.tsx
```

---

## Common Issues

### Issue: "User progression not found"

**Cause**: User doesn't have a progression record yet.

**Fix**: Progression is created on first gamification API call. Ensure the user has an active subscription.

### Issue: Achievements not unlocking

**Cause**: Achievement checker not hooked into events.

**Fix**: Ensure pillar check-in and call completion flows call `achievementChecker.check(userId)`.

### Issue: Mascot mood stuck on neutral

**Cause**: Mood engine not being called on dashboard load.

**Fix**: Dashboard should call `GET /api/gamification/mascot` which calculates mood.

### Issue: XP multiplier not applying

**Cause**: Streak not synced to user_progression.

**Fix**: Ensure streak updates also update `user_progression.streak_multiplier` via `get_streak_multiplier()`.

---

## Environment Variables

Backend (`.env` or `wrangler.toml`):
```
# No new env vars needed - uses existing Supabase connection
```

Frontend (`.env.local`):
```
# No new env vars needed - uses existing API base URL
```

---

## Useful SQL Queries

### Reset User Gamification (for testing)

```sql
-- Clear all gamification data for a user
DELETE FROM xp_transactions WHERE user_id = 'your-uuid';
DELETE FROM user_achievements WHERE user_id = 'your-uuid';
DELETE FROM user_accessories WHERE user_id = 'your-uuid';
DELETE FROM daily_challenges WHERE user_id = 'your-uuid';
DELETE FROM weekly_leaderboard WHERE user_id = 'your-uuid';
DELETE FROM user_progression WHERE user_id = 'your-uuid';
```

### Grant Test XP

```sql
-- Give user 1000 XP for testing
UPDATE user_progression
SET total_xp = 1000,
    current_level = 8,
    xp_in_current_level = 50,
    xp_to_next_level = 150
WHERE user_id = 'your-uuid';
```

### Unlock All Achievements (for testing)

```sql
INSERT INTO user_achievements (user_id, achievement_id, notified)
SELECT 'your-uuid', id, true FROM achievements
ON CONFLICT DO NOTHING;
```

### Unlock All Accessories (for testing)

```sql
INSERT INTO user_accessories (user_id, accessory_id, equipped)
SELECT 'your-uuid', id, false FROM mascot_accessories
ON CONFLICT DO NOTHING;
```
