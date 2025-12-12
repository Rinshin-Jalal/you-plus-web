-- ============================================================================
-- Migration 014: Onboarding Jobs Table
-- ============================================================================
-- Tracks async onboarding processing jobs triggered via Trigger.dev.
-- Allows frontend to poll for completion status.
-- ============================================================================

-- Create onboarding_jobs table
CREATE TABLE IF NOT EXISTS onboarding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Job status
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Progress tracking (for frontend display)
  current_step VARCHAR(50),  -- e.g., 'transcribing', 'cloning_voice', 'uploading'
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Result data (populated on completion)
  future_self_id UUID,
  voice_cloned BOOLEAN DEFAULT FALSE,
  pillars_created TEXT[],  -- Array of created pillar IDs
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Trigger.dev integration
  trigger_run_id VARCHAR(255),  -- Trigger.dev run ID for debugging
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_onboarding_jobs_user_id ON onboarding_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_jobs_status ON onboarding_jobs(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_jobs_created_at ON onboarding_jobs(created_at DESC);

-- Only allow one active job per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_jobs_user_active 
  ON onboarding_jobs(user_id) 
  WHERE status IN ('pending', 'processing');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS trigger_update_onboarding_job_timestamp ON onboarding_jobs;
CREATE TRIGGER trigger_update_onboarding_job_timestamp
  BEFORE UPDATE ON onboarding_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_job_timestamp();

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE onboarding_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own jobs
CREATE POLICY "Users can read own onboarding jobs"
  ON onboarding_jobs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can do everything (for Trigger.dev)
CREATE POLICY "Service role has full access to onboarding jobs"
  ON onboarding_jobs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE onboarding_jobs IS 
  'Tracks async onboarding processing. Heavy tasks (transcription, voice cloning, R2 uploads) run on Trigger.dev.';

COMMENT ON COLUMN onboarding_jobs.status IS 
  'pending = queued, processing = running on Trigger.dev, completed = success, failed = error';

COMMENT ON COLUMN onboarding_jobs.current_step IS 
  'Current processing step for progress display: transcribing, cloning_voice, uploading_audio, saving_data';

COMMENT ON COLUMN onboarding_jobs.trigger_run_id IS 
  'Trigger.dev run ID for debugging failed jobs in the Trigger.dev dashboard';
