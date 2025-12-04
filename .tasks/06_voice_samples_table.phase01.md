# Task 06: Separate Voice Samples from Identity

## Objective

Create a dedicated table for voice recordings. The identity table should only have text data - voice samples are for Cartesia voice cloning, not psychological context.

## Current State

Voice URLs are in the identity table:
```sql
identity.why_it_matters_audio_url
identity.cost_of_quitting_audio_url  
identity.commitment_audio_url
```

## New Design

```sql
-- New table for voice samples
CREATE TABLE voice_samples (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  
  -- What type of recording
  sample_type text NOT NULL CHECK (sample_type IN (
    'why_it_matters',
    'cost_of_quitting', 
    'commitment',
    'voice_clone_source',  -- For future: dedicated cloning samples
    'other'
  )),
  
  -- The actual audio
  audio_url text NOT NULL,           -- URL to audio file
  audio_duration_seconds integer,    -- Length of recording
  
  -- Transcription (for Supermemory)
  transcript text,                   -- Speech-to-text result
  transcript_confidence float,       -- Transcription confidence
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, sample_type)  -- One of each type per user
);

CREATE INDEX idx_voice_samples_user_id ON voice_samples(user_id);
```

## Migration SQL

```sql
-- migrations/007_voice_samples_table.sql

-- 1. Create new table
CREATE TABLE IF NOT EXISTS voice_samples (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  sample_type text NOT NULL CHECK (sample_type IN (
    'why_it_matters',
    'cost_of_quitting', 
    'commitment',
    'voice_clone_source',
    'other'
  )),
  audio_url text NOT NULL,
  audio_duration_seconds integer,
  transcript text,
  transcript_confidence float,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sample_type)
);

CREATE INDEX IF NOT EXISTS idx_voice_samples_user_id ON voice_samples(user_id);

-- 2. Migrate existing data from identity table
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

-- 3. After verification, drop old columns from identity
-- (Run this manually after confirming migration worked)
-- ALTER TABLE identity DROP COLUMN IF EXISTS why_it_matters_audio_url;
-- ALTER TABLE identity DROP COLUMN IF EXISTS cost_of_quitting_audio_url;
-- ALTER TABLE identity DROP COLUMN IF EXISTS commitment_audio_url;
```

## Backend Changes

### Update Onboarding Handler

```typescript
// old-backend-for-swift/src/features/onboarding/handlers/conversion-complete.ts

// BEFORE (in identity table)
await supabase.from("identity").upsert({
  user_id: userId,
  why_it_matters_audio_url: voiceUploads.whyItMatters,
  // ...
});

// AFTER (in voice_samples table)
if (voiceUploads.whyItMatters) {
  await supabase.from("voice_samples").upsert({
    user_id: userId,
    sample_type: "why_it_matters",
    audio_url: voiceUploads.whyItMatters,
  }, {
    onConflict: "user_id,sample_type"
  });
}

if (voiceUploads.costOfQuitting) {
  await supabase.from("voice_samples").upsert({
    user_id: userId,
    sample_type: "cost_of_quitting",
    audio_url: voiceUploads.costOfQuitting,
  }, {
    onConflict: "user_id,sample_type"
  });
}

if (voiceUploads.commitment) {
  await supabase.from("voice_samples").upsert({
    user_id: userId,
    sample_type: "commitment",
    audio_url: voiceUploads.commitment,
  }, {
    onConflict: "user_id,sample_type"
  });
}
```

## Transcription Service (Future)

For Supermemory integration, we should transcribe voice recordings:

```typescript
// Future: Transcribe and send to Supermemory
async function processVoiceSample(
  userId: string,
  sampleType: string,
  audioUrl: string
) {
  // 1. Transcribe with Whisper/Deepgram/etc
  const transcript = await transcribeAudio(audioUrl);
  
  // 2. Save transcript to voice_samples
  await supabase.from("voice_samples")
    .update({ 
      transcript: transcript.text,
      transcript_confidence: transcript.confidence
    })
    .eq("user_id", userId)
    .eq("sample_type", sampleType);
  
  // 3. Send to Supermemory
  await addMemory(userId, 
    `VOICE RECORDING - ${sampleType.toUpperCase()}:\n"${transcript.text}"`,
    { type: "voice_transcript", recording: sampleType }
  );
}
```

## Voice Cloning Flow

The voice samples are used for Cartesia voice cloning:

```
1. User records voice during onboarding
2. Audio uploaded to Supabase Storage
3. URL saved to voice_samples table
4. Cartesia clones voice from samples
5. Voice ID saved to identity.cartesia_voice_id
6. Agent uses cloned voice for TTS
```

The TEXT content of what they said goes to Supermemory.
The AUDIO stays in voice_samples for cloning.

## Update Database Docs

Update `agent/docs/database.sql`:

```sql
-- ============================================================================
-- 8. VOICE_SAMPLES - Voice recordings for cloning (separate from identity)
-- ============================================================================
CREATE TABLE public.voice_samples (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  sample_type text NOT NULL,
  audio_url text NOT NULL,
  audio_duration_seconds integer,
  transcript text,
  transcript_confidence float,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT voice_samples_pkey PRIMARY KEY (id),
  CONSTRAINT voice_samples_user_type_unique UNIQUE (user_id, sample_type)
);
```

## Testing

1. Run migration
2. Verify existing voice URLs migrated
3. Complete new onboarding
4. Verify voice samples go to new table
5. Verify Cartesia cloning still works
6. Drop old columns from identity

---

**Status: PENDING**
**Depends on: Task 01 (simplified identity table)**
**Blocks: None (can be done in parallel with other tasks)**
