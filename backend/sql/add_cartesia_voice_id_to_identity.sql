-- ═══════════════════════════════════════════════════════════════════════════════
-- 🎤 ADD CARTESIA VOICE ID TO IDENTITY TABLE
-- 
-- Stores the cloned voice ID from Cartesia for the "Future You" agent.
-- This voice is used by Cartesia Line SDK for outbound calls.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add cartesia_voice_id column to identity table
ALTER TABLE identity 
ADD COLUMN IF NOT EXISTS cartesia_voice_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN identity.cartesia_voice_id IS 'Cartesia cloned voice ID for Future You agent calls';

-- Optional: Create index if we need to look up users by voice ID
CREATE INDEX IF NOT EXISTS idx_identity_cartesia_voice_id ON identity(cartesia_voice_id) WHERE cartesia_voice_id IS NOT NULL;
