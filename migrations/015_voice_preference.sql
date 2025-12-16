-- Migration: Add voice_source column to future_self table
-- This tracks whether the user chose to clone their voice or use a preset voice

-- Add voice_source column
ALTER TABLE future_self 
ADD COLUMN IF NOT EXISTS voice_source TEXT DEFAULT 'cloned' 
CHECK (voice_source IN ('cloned', 'preset'));

-- Add comment for documentation
COMMENT ON COLUMN future_self.voice_source IS 'Voice source type: cloned (user voice clone) or preset (curated Cartesia voice)';

-- Note: cartesia_voice_id column already exists and will store either:
-- - The cloned voice ID (when voice_source = 'cloned')
-- - The preset voice ID (when voice_source = 'preset')
