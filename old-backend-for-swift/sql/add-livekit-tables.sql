/**
 * LiveKit Migration: Database Schema Updates
 *
 * Adds new tables and columns to support LiveKit infrastructure
 * while maintaining backward compatibility with ElevenLabs legacy data
 *
 * Created: Phase 5.2
 */

-- ============================================================================
-- 1. LiveKit Sessions Table
-- ============================================================================
-- Tracks individual LiveKit room sessions for calls

CREATE TABLE IF NOT EXISTS public.livekit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User & Call Reference
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  call_uuid TEXT NOT NULL,

  -- LiveKit Room Reference
  room_name TEXT NOT NULL,
  room_sid TEXT UNIQUE,

  -- Participant Information
  participant_identity TEXT NOT NULL,
  participant_sid TEXT UNIQUE,

  -- Call Configuration
  call_type TEXT NOT NULL,
  mood TEXT,

  -- Voice Configuration (Cartesia)
  cartesia_voice_id TEXT,
  cartesia_model TEXT DEFAULT 'sonic-3',

  -- Memory Configuration (Supermemory)
  supermemory_user_id TEXT,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_sec INT,

  -- Status Tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'failed', 'disconnected')),
  disconnection_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
) TABLESPACE pg_default;

-- Indexes for performance
CREATE INDEX idx_livekit_sessions_user_id ON public.livekit_sessions(user_id);
CREATE INDEX idx_livekit_sessions_room_name ON public.livekit_sessions(room_name);
CREATE INDEX idx_livekit_sessions_status ON public.livekit_sessions(status);
CREATE INDEX idx_livekit_sessions_call_uuid ON public.livekit_sessions(call_uuid);
CREATE INDEX idx_livekit_sessions_started_at ON public.livekit_sessions(started_at DESC);

-- RLS Policies
ALTER TABLE public.livekit_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own livekit_sessions"
  ON public.livekit_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own livekit_sessions"
  ON public.livekit_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own livekit_sessions"
  ON public.livekit_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. LiveKit Rooms Table
-- ============================================================================
-- Tracks LiveKit room lifecycle and statistics

CREATE TABLE IF NOT EXISTS public.livekit_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Room Identity
  room_name TEXT NOT NULL UNIQUE,
  room_sid TEXT UNIQUE,

  -- Room Lifecycle
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_sec INT,

  -- Participants
  participant_count INT DEFAULT 0,
  max_participant_count INT DEFAULT 0,

  -- Network Metrics
  max_bitrate INT,
  avg_latency_ms INT,
  packet_loss_percent DECIMAL(5, 2),

  -- Recording
  recording_available BOOLEAN DEFAULT false,
  recording_url TEXT,
  recording_size_bytes BIGINT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  updated_at TIMESTAMPTZ DEFAULT now()
) TABLESPACE pg_default;

-- Indexes for performance
CREATE INDEX idx_livekit_rooms_created_at ON public.livekit_rooms(created_at DESC);
CREATE INDEX idx_livekit_rooms_recording ON public.livekit_rooms(recording_available);

-- ============================================================================
-- 3. Extend Calls Table for LiveKit Support
-- ============================================================================
-- Add LiveKit-specific fields to calls table while keeping ElevenLabs fields

DO $$ BEGIN
  -- Check if column already exists (idempotent)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='calls' AND column_name='livekit_session_id'
  ) THEN
    ALTER TABLE public.calls ADD COLUMN livekit_session_id UUID REFERENCES public.livekit_sessions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='calls' AND column_name='livekit_room_sid'
  ) THEN
    ALTER TABLE public.calls ADD COLUMN livekit_room_sid TEXT REFERENCES public.livekit_rooms(room_sid) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='calls' AND column_name='provider'
  ) THEN
    ALTER TABLE public.calls ADD COLUMN provider TEXT DEFAULT 'elevenlabs' CHECK (provider IN ('elevenlabs', 'livekit', 'vapi'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='calls' AND column_name='cartesia_voice_id'
  ) THEN
    ALTER TABLE public.calls ADD COLUMN cartesia_voice_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='calls' AND column_name='audio_quality_score'
  ) THEN
    ALTER TABLE public.calls ADD COLUMN audio_quality_score DECIMAL(3, 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='calls' AND column_name='agent_response_latency_ms'
  ) THEN
    ALTER TABLE public.calls ADD COLUMN agent_response_latency_ms INT;
  END IF;

END $$;

-- Index for LiveKit provider calls
CREATE INDEX IF NOT EXISTS idx_calls_provider_date ON public.calls(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_livekit_session ON public.calls(livekit_session_id);

-- ============================================================================
-- 4. Update Timestamp Triggers
-- ============================================================================
-- Ensure updated_at is automatically updated for new tables

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to livekit_sessions
DROP TRIGGER IF EXISTS update_livekit_sessions_updated_at ON public.livekit_sessions;
CREATE TRIGGER update_livekit_sessions_updated_at
  BEFORE UPDATE ON public.livekit_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to livekit_rooms
DROP TRIGGER IF EXISTS update_livekit_rooms_updated_at ON public.livekit_rooms;
CREATE TRIGGER update_livekit_rooms_updated_at
  BEFORE UPDATE ON public.livekit_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.livekit_sessions IS 'Tracks individual LiveKit call sessions with room and participant information';
COMMENT ON TABLE public.livekit_rooms IS 'Tracks LiveKit room lifecycle, participants, and recording metadata';

COMMENT ON COLUMN public.calls.provider IS 'Call provider: elevenlabs (legacy), livekit (current), vapi (alternative)';
COMMENT ON COLUMN public.calls.livekit_session_id IS 'Reference to LiveKit session for real-time call details';
COMMENT ON COLUMN public.calls.cartesia_voice_id IS 'Cartesia TTS voice identifier for LiveKit calls';
COMMENT ON COLUMN public.calls.audio_quality_score IS 'Subjective audio quality rating (0-10)';
COMMENT ON COLUMN public.calls.agent_response_latency_ms IS 'Time from user speech end to agent response start (ms)';

-- ============================================================================
-- BACKWARD COMPATIBILITY NOTES
-- ============================================================================
-- The following ElevenLabs fields are PRESERVED for historical data access:
-- - calls.conversation_id (ElevenLabs unique ID)
-- - calls.agent_id (ElevenLabs agent configuration)
-- - calls.source (original provider: 'vapi' | 'elevenlabs')
--
-- New LiveKit calls will:
-- - Set provider='livekit'
-- - Populate livekit_session_id for real-time data
-- - Use cartesia_voice_id instead of voice_id
-- - Have enhanced metrics in audio_quality_score, agent_response_latency_ms
