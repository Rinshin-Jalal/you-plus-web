-- ============================================================================
-- Migration 007: Create Voice Samples Table
-- ============================================================================
-- 
-- Separates voice recordings from identity table.
-- Voice samples are for Cartesia voice cloning, not psychological context.
--
-- The TEXT content of recordings goes to Supermemory as memories.
-- The AUDIO files stay here for voice cloning.
--
-- ============================================================================

-- 1. Create voice_samples table
CREATE TABLE IF NOT EXISTS voice_samples (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- What type of recording
  sample_type text NOT NULL CHECK (sample_type IN (
    'why_it_matters',
    'cost_of_quitting', 
    'commitment',
    'voice_clone_source',  -- For dedicated cloning samples
    'other'
  )),
  
  -- The actual audio
  audio_url text NOT NULL,
  audio_duration_seconds integer,
  
  -- Transcription (text version for Supermemory)
  transcript text,
  transcript_confidence float,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  
  -- One of each type per user
  UNIQUE(user_id, sample_type)
);

-- 2. Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_voice_samples_user_id ON voice_samples(user_id);

-- 3. Add RLS policies
ALTER TABLE voice_samples ENABLE ROW LEVEL SECURITY;

-- Users can read their own samples
CREATE POLICY "Users can view own voice samples"
  ON voice_samples FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own samples
CREATE POLICY "Users can insert own voice samples"
  ON voice_samples FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access to voice samples"
  ON voice_samples FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Migrate existing data from identity table
INSERT INTO voice_samples (user_id, sample_type, audio_url, created_at)
SELECT 
  user_id, 
  'why_it_matters', 
  why_it_matters_audio_url,
  created_at
FROM identity
WHERE why_it_matters_audio_url IS NOT NULL
ON CONFLICT (user_id, sample_type) DO NOTHING;

INSERT INTO voice_samples (user_id, sample_type, audio_url, created_at)
SELECT 
  user_id, 
  'cost_of_quitting', 
  cost_of_quitting_audio_url,
  created_at
FROM identity
WHERE cost_of_quitting_audio_url IS NOT NULL
ON CONFLICT (user_id, sample_type) DO NOTHING;

INSERT INTO voice_samples (user_id, sample_type, audio_url, created_at)
SELECT 
  user_id, 
  'commitment', 
  commitment_audio_url,
  created_at
FROM identity
WHERE commitment_audio_url IS NOT NULL
ON CONFLICT (user_id, sample_type) DO NOTHING;

-- 5. Add helpful comments
COMMENT ON TABLE voice_samples IS 
'Voice recordings for Cartesia voice cloning. Transcripts sent to Supermemory separately.';

COMMENT ON COLUMN voice_samples.transcript IS 
'Speech-to-text result. Sent to Supermemory for memory. NULL until transcribed.';

-- ============================================================================
-- NOTE: After verifying migration worked, drop old columns from identity:
-- ALTER TABLE identity DROP COLUMN IF EXISTS why_it_matters_audio_url;
-- ALTER TABLE identity DROP COLUMN IF EXISTS cost_of_quitting_audio_url;
-- ALTER TABLE identity DROP COLUMN IF EXISTS commitment_audio_url;
-- ============================================================================
