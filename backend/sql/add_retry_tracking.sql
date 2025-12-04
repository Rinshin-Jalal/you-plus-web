-- Complete migration for retry tracking system
-- Run this in your Supabase SQL editor

-- 1. Add retry tracking columns
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS is_retry BOOLEAN DEFAULT FALSE;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS retry_attempt_number INTEGER;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS original_call_uuid TEXT;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS retry_reason TEXT CHECK (retry_reason IN ('missed', 'declined', 'failed'));
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS urgency TEXT CHECK (urgency IN ('high', 'critical', 'emergency'));
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS timeout_at TIMESTAMPTZ;

-- 2. Update call_type constraint to support all call types
ALTER TABLE public.calls DROP CONSTRAINT IF EXISTS call_recordings_call_type_check;

ALTER TABLE public.calls ADD CONSTRAINT call_recordings_call_type_check 
CHECK (
  call_type = ANY (
    ARRAY[
      'morning'::text,
      'evening'::text, 
      'first_call'::text,
      'apology_call'::text,
      'emergency'::text
    ]
  )
);

-- 3. Add indexes for retry tracking
CREATE INDEX IF NOT EXISTS idx_calls_retry_tracking ON calls(user_id, call_type, is_retry) WHERE is_retry = TRUE;
CREATE INDEX IF NOT EXISTS idx_calls_timeout ON calls(timeout_at) WHERE acknowledged = FALSE;
CREATE INDEX IF NOT EXISTS idx_calls_acknowledged ON calls(acknowledged) WHERE acknowledged = FALSE;

-- 4. Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'calls' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Test the constraint
-- This should work:
-- INSERT INTO calls (user_id, call_type, audio_url, duration_sec) VALUES ('test', 'first_call', 'test', 0);
-- This should fail:
-- INSERT INTO calls (user_id, call_type, audio_url, duration_sec) VALUES ('test', 'invalid_type', 'test', 0);