-- =====================================================
-- Add REMAINING Missing Onboarding Fields to Identity Table  
-- =====================================================
-- Adds the fields that were missing from previous migrations
-- These fields are causing PGRST204 errors in unified identity extractor

-- Add the remaining missing BIGBRUH onboarding fields to Identity table
-- Using ACTUAL db_field names from step definitions that are still missing
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS voice_commitment TEXT,        -- Step 3: Initial voice commitment
ADD COLUMN IF NOT EXISTS biggest_lie TEXT,             -- Step 4: The lie you tell yourself
ADD COLUMN IF NOT EXISTS favorite_excuse TEXT,         -- Step 5: Your go-to excuse
ADD COLUMN IF NOT EXISTS weakness_window TEXT,         -- Step 8: When you're weakest
ADD COLUMN IF NOT EXISTS fear_version TEXT,            -- Step 14: Fear version of yourself
ADD COLUMN IF NOT EXISTS morning_failure TEXT,         -- Step 16: Morning failure pattern
ADD COLUMN IF NOT EXISTS quit_counter TEXT,            -- Step 17: How many times you've quit
ADD COLUMN IF NOT EXISTS commitment_time TEXT,         -- Step 19: Time commitment per day
ADD COLUMN IF NOT EXISTS excuse_sophistication TEXT,   -- Step 23: Most sophisticated excuse
ADD COLUMN IF NOT EXISTS accountability_style TEXT,    -- Step 24: What actually makes you move
ADD COLUMN IF NOT EXISTS success_memory TEXT,          -- Step 25: Memory of success
ADD COLUMN IF NOT EXISTS biggest_enemy TEXT,           -- Step 32: What's holding you back
ADD COLUMN IF NOT EXISTS sacrifice_list TEXT,          -- Step 34: What you need to sacrifice
ADD COLUMN IF NOT EXISTS evening_call_time TEXT,       -- Step 37: Evening call preference
ADD COLUMN IF NOT EXISTS identity_declaration TEXT,    -- Step 42: Final identity declaration
ADD COLUMN IF NOT EXISTS consequence_acceptance TEXT,   -- Step 44: Consequence acceptance  
ADD COLUMN IF NOT EXISTS identity_goal TEXT,           -- Step ?: Identity goal
ADD COLUMN IF NOT EXISTS last_failure TEXT,            -- Step ?: Last failure
ADD COLUMN IF NOT EXISTS oath_recording TEXT,          -- Step ?: Oath recording
ADD COLUMN IF NOT EXISTS war_cry TEXT,                 -- Step ?: War cry
ADD COLUMN IF NOT EXISTS external_judge TEXT,          -- Step ?: External judge
ADD COLUMN IF NOT EXISTS daily_non_negotiable TEXT;    -- Step ?: Daily non-negotiable

-- Add detailed comments explaining each field from step definitions
COMMENT ON COLUMN identity.voice_commitment IS 'Step 3: Initial voice commitment (voice field) - first psychological contract';
COMMENT ON COLUMN identity.biggest_lie IS 'Step 4: The lie you tell yourself (voice field) - self-deception patterns';
COMMENT ON COLUMN identity.favorite_excuse IS 'Step 5: Your go-to excuse (voice field) - default rationalization';
COMMENT ON COLUMN identity.weakness_window IS 'Step 8: When you are weakest (voice field) - vulnerability timing';
COMMENT ON COLUMN identity.fear_version IS 'Step 14: Fear version of yourself (voice field) - negative identity vision';
COMMENT ON COLUMN identity.morning_failure IS 'Step 16: Morning failure pattern (voice field) - daily weakness identification';
COMMENT ON COLUMN identity.quit_counter IS 'Step 17: How many times you have quit (voice field) - failure history accountability';
COMMENT ON COLUMN identity.commitment_time IS 'Step 19: Time commitment per day (text field) - daily investment requirement';
COMMENT ON COLUMN identity.excuse_sophistication IS 'Step 23: Most sophisticated excuse (voice field) - advanced rationalization detection';
COMMENT ON COLUMN identity.accountability_style IS 'Step 24: What actually makes you move (choice field) - motivation trigger identification';
COMMENT ON COLUMN identity.success_memory IS 'Step 25: Memory of success (voice field) - past achievement reminder';
COMMENT ON COLUMN identity.biggest_enemy IS 'Step 32: What is holding you back (choice field) - primary obstacle identification';
COMMENT ON COLUMN identity.sacrifice_list IS 'Step 34: What you need to sacrifice (text field) - required trade-offs';
COMMENT ON COLUMN identity.evening_call_time IS 'Step 37: Evening call preference (time field) - daily accountability timing';
COMMENT ON COLUMN identity.identity_declaration IS 'Step 42: Final identity declaration (voice field) - transformed self commitment';
COMMENT ON COLUMN identity.consequence_acceptance IS 'Step 44: Consequence acceptance (voice field) - accountability for breaking promise';
COMMENT ON COLUMN identity.identity_goal IS 'Identity goal (text field) - target achievement';
COMMENT ON COLUMN identity.last_failure IS 'Last failure (voice field) - recent accountability moment';
COMMENT ON COLUMN identity.oath_recording IS 'Oath recording (voice field) - binding commitment';
COMMENT ON COLUMN identity.war_cry IS 'War cry (voice field) - motivational battle cry';
COMMENT ON COLUMN identity.external_judge IS 'External judge (text field) - accountability contact';
COMMENT ON COLUMN identity.daily_non_negotiable IS 'Daily non-negotiable (text field) - required daily action';

-- Verify migration completed successfully
-- Run this query to check all new fields exist:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns  
-- WHERE table_name = 'identity'
-- AND column_name IN ('voice_commitment', 'biggest_lie', 'favorite_excuse', 'weakness_window', 'fear_version', 'morning_failure', 'quit_counter', 'commitment_time', 'excuse_sophistication', 'accountability_style', 'success_memory', 'biggest_enemy', 'sacrifice_list', 'evening_call_time', 'identity_declaration', 'consequence_acceptance', 'identity_goal', 'last_failure', 'oath_recording', 'war_cry', 'external_judge', 'daily_non_negotiable')
-- ORDER BY column_name;