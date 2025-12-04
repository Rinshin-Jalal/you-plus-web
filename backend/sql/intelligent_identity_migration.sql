-- =====================================================
-- INTELLIGENT IDENTITY SCHEMA MIGRATION
-- =====================================================
-- Complete overhaul of identity table to use intelligent AI-extracted fields
-- Removes 80+ granular fields and replaces with 13 actionable columns
-- Preserves operational functionality while adding psychological intelligence

-- STEP 1: DROP ALL EXISTING PSYCHOLOGICAL FIELDS
-- Remove the data sprawl of 80+ individual onboarding fields
ALTER TABLE identity
DROP COLUMN IF EXISTS current_struggle,
DROP COLUMN IF EXISTS nightmare_self,
DROP COLUMN IF EXISTS empty_excuse,
DROP COLUMN IF EXISTS success_legacy,
DROP COLUMN IF EXISTS betrayal_cost,
DROP COLUMN IF EXISTS desired_outcome,
DROP COLUMN IF EXISTS key_sacrifice,
DROP COLUMN IF EXISTS last_broken_promise,
DROP COLUMN IF EXISTS external_judgment,
DROP COLUMN IF EXISTS regret_if_no_change,
DROP COLUMN IF EXISTS meaning_of_breaking_contract,
DROP COLUMN IF EXISTS future_self_first_words,
DROP COLUMN IF EXISTS final_oath,
DROP COLUMN IF EXISTS disappointment_check,
DROP COLUMN IF EXISTS procrastination_now,
DROP COLUMN IF EXISTS sabotage_pattern,
DROP COLUMN IF EXISTS time_waster,
DROP COLUMN IF EXISTS success_metric,
DROP COLUMN IF EXISTS transformation_date,
DROP COLUMN IF EXISTS streak_target,
DROP COLUMN IF EXISTS failure_threshold,
DROP COLUMN IF EXISTS contract_seal,
DROP COLUMN IF EXISTS first_action,
DROP COLUMN IF EXISTS voice_commitment,
DROP COLUMN IF EXISTS biggest_lie,
DROP COLUMN IF EXISTS favorite_excuse,
DROP COLUMN IF EXISTS weakness_window,
DROP COLUMN IF EXISTS fear_version,
DROP COLUMN IF EXISTS morning_failure,
DROP COLUMN IF EXISTS quit_counter,
DROP COLUMN IF EXISTS commitment_time,
DROP COLUMN IF EXISTS excuse_sophistication,
DROP COLUMN IF EXISTS accountability_style,
DROP COLUMN IF EXISTS success_memory,
DROP COLUMN IF EXISTS biggest_enemy,
DROP COLUMN IF EXISTS sacrifice_list,
DROP COLUMN IF EXISTS evening_call_time,
DROP COLUMN IF EXISTS identity_declaration,
DROP COLUMN IF EXISTS consequence_acceptance,
DROP COLUMN IF EXISTS identity_goal,
DROP COLUMN IF EXISTS last_failure,
DROP COLUMN IF EXISTS oath_recording,
DROP COLUMN IF EXISTS war_cry,
DROP COLUMN IF EXISTS external_judge,
DROP COLUMN IF EXISTS motivation_fear_intensity,
DROP COLUMN IF EXISTS motivation_desire_intensity,
DROP COLUMN IF EXISTS self_trust,
DROP COLUMN IF EXISTS consistency,
DROP COLUMN IF EXISTS commitment_likelihood,
DROP COLUMN IF EXISTS timezone,
DROP COLUMN IF EXISTS wake_time,
DROP COLUMN IF EXISTS morning_call_window,
DROP COLUMN IF EXISTS bed_time,
DROP COLUMN IF EXISTS evening_call_window,
DROP COLUMN IF EXISTS enforcement_tone,
DROP COLUMN IF EXISTS weak_excuse_counter,
DROP COLUMN IF EXISTS urls;

-- STEP 2: RENAME OPERATIONAL FIELD
-- Rename identity_name to just name for simplicity
ALTER TABLE identity RENAME COLUMN identity_name TO name;

-- STEP 3: ADD OPERATIONAL FIELDS (4 essential system fields)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS call_window TIME,
ADD COLUMN IF NOT EXISTS transformation_target_date DATE;

-- Note: daily_non_negotiable should already exist, but add if missing
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS daily_non_negotiable TEXT;

-- STEP 4: ADD IDENTITY FIELDS (7 core psychological profile fields)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS current_identity TEXT,
ADD COLUMN IF NOT EXISTS aspirated_identity TEXT,
ADD COLUMN IF NOT EXISTS fear_identity TEXT,
ADD COLUMN IF NOT EXISTS core_struggle TEXT,
ADD COLUMN IF NOT EXISTS biggest_enemy TEXT,
ADD COLUMN IF NOT EXISTS primary_excuse TEXT,
ADD COLUMN IF NOT EXISTS sabotage_method TEXT;

-- STEP 5: ADD BEHAVIORAL FIELDS (6 action pattern fields)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS weakness_time_window VARCHAR(20),
ADD COLUMN IF NOT EXISTS procrastination_focus TEXT,
ADD COLUMN IF NOT EXISTS last_major_failure TEXT,
ADD COLUMN IF NOT EXISTS past_success_story TEXT,
ADD COLUMN IF NOT EXISTS accountability_trigger VARCHAR(30),
ADD COLUMN IF NOT EXISTS war_cry TEXT;

-- STEP 6: ADD COLUMN COMMENTS FOR DOCUMENTATION
COMMENT ON COLUMN identity.name IS 'What to call the user during accountability calls';
COMMENT ON COLUMN identity.daily_non_negotiable IS 'Their ONE daily commitment they swore to do';
COMMENT ON COLUMN identity.call_window IS 'Time window when they want to receive calls';
COMMENT ON COLUMN identity.transformation_target_date IS 'Date when they want to be completely transformed';

COMMENT ON COLUMN identity.current_identity IS 'Who they are right now (AI-extracted from voice responses)';
COMMENT ON COLUMN identity.aspirated_identity IS 'Who they want to become (AI-extracted from future self responses)';
COMMENT ON COLUMN identity.fear_identity IS 'Who they are terrified of becoming (AI-extracted from nightmare self)';
COMMENT ON COLUMN identity.core_struggle IS 'Their main life struggle right now (AI-extracted)';
COMMENT ON COLUMN identity.biggest_enemy IS 'The pattern/thing that always defeats them (AI-extracted)';
COMMENT ON COLUMN identity.primary_excuse IS 'Their go-to excuse for giving up (AI-extracted)';
COMMENT ON COLUMN identity.sabotage_method IS 'How they ruin their own success (AI-extracted)';

COMMENT ON COLUMN identity.weakness_time_window IS 'Time of day/situation when they typically break';
COMMENT ON COLUMN identity.procrastination_focus IS 'What they are avoiding doing RIGHT NOW';
COMMENT ON COLUMN identity.last_major_failure IS 'Last time they completely gave up on something important';
COMMENT ON COLUMN identity.past_success_story IS 'One time they actually followed through successfully';
COMMENT ON COLUMN identity.accountability_trigger IS 'What type of accountability makes them move (shame, confrontation, etc.)';
COMMENT ON COLUMN identity.war_cry IS 'What they will scream/say when they want to quit but need to push through';

-- STEP 7: VERIFICATION QUERIES
-- Run these to verify the migration completed successfully:

-- Check final schema has exactly the right columns:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'identity' 
-- ORDER BY column_name;

-- Should show these 17 columns total:
-- id, user_id, name, identity_summary, created_at, updated_at
-- daily_non_negotiable, call_window, transformation_target_date
-- current_identity, aspirated_identity, fear_identity, core_struggle, biggest_enemy, primary_excuse, sabotage_method
-- weakness_time_window, procrastination_focus, last_major_failure, past_success_story, accountability_trigger, war_cry