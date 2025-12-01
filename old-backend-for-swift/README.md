# YOU+ Backend Engine

A comprehensive backend system that powers the YOU+ accountability app's core features: intelligent onboarding, daily promise tracking, consequence delivery, tone analysis, and AI-generated calls.

## 🚀 System Overview

This Cloudflare Worker-based system orchestrates:

- **V3 Onboarding Flow**: 45-step psychological transformation with file processing
- **Daily Call Generation**: 2x/day automated calls (morning & evening)
- **Promise Loop Management**: Creation, tracking, and consequence delivery
- **Tone Engine**: Adaptive mood adjustment based on user patterns
- **Memory System**: Long-term learning from user patterns and excuses
- **Identity Extraction**: Voice transcription and psychological profiling
- **File Processing**: Audio/image uploads to R2 cloud storage
- **TTS Integration**: Multi-provider text-to-speech with 11labs primary

## 📋 Features

### Core Engine Components

1. **Onboarding Engine** (`/routes/onboarding.ts`)

   - V3 45-step psychological transformation flow
   - File processing (audio/images → R2 cloud storage)
   - Identity extraction and voice cloning
   - Psychological profiling and pattern analysis
   - Anonymous to authenticated user migration

2. **Consequence Engine** (`/services/consequence-engine.ts`)

   - Orchestrates all systems
   - Processes user calls and promise loops
   - Handles morning promise creation and evening consequence delivery

3. **Tone Engine** (`/services/tone-engine.ts`)

   - Analyzes user patterns (streak, failures, trends)
   - Recommends optimal transmission mood
   - Supports: `supportive`, `neutral`, `concerned`

4. **Prompt Engine** (`/services/prompt-engine.ts`)

   - Generates contextual AI prompts
   - Incorporates user history, memories, and patterns
   - Creates compelling accountability dialogue

5. **File Processing** (`/utils/onboardingFileProcessor.ts`)

   - Processes base64 audio/images from frontend
   - Uploads to R2 cloud storage
   - Replaces local URIs with cloud URLs
   - Handles multiple file types and formats

6. **Identity Extraction** (`/services/identity-extractor.ts`)

   - Transcribes voice recordings using OpenAI Whisper
   - Extracts psychological insights from responses
   - Creates comprehensive user profiles
   - Generates personalized call scripts

7. **TTS Service** (`/services/tts-service.ts`)

   - Primary: 11labs (voice cloning support)
   - Fallbacks: OpenAI → Cartesia AI
   - Personalized voice generation

8. **Database Layer** (`/utils/database.ts`)
   - Supabase integration
   - All CRUD operations for schema
   - User context aggregation

## 🛠️ Setup & Deployment

### Prerequisites

```bash
# Install dependencies
npm install

# Install Wrangler CLI
npm install -g wrangler
```

### Environment Variables

Set these secrets in Cloudflare:

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put ELEVENLABS_API_KEY
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put R2_BUCKET_NAME
```

### Development

```bash
# Start local development
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

### Cron Schedule

The system runs on these triggers:

- **Morning Calls**: 6 AM - 12 PM UTC (every hour)
- **Evening Calls**: 6 PM - 11 PM UTC (every hour)

## 🔧 API Endpoints

### System Status

```
GET /
GET /stats
```

### Onboarding Flow

```
POST /onboarding/complete    # Main 45-step completion
POST /onboarding/extract-data   # Re-extract identity data
```

### Call Generation

```
POST /trigger/morning    # Manual morning batch trigger
POST /trigger/evening    # Manual evening batch trigger
POST /call/:userId/:callType    # Individual call generation
```

### Promise Management

```
POST /promise/create
{
  "userId": "uuid",
  "promiseText": "string"
}

POST /promise/complete
{
  "userId": "uuid",
  "promiseId": "uuid",
  "wasKept": boolean,
  "excuseText": "string" // optional
}
```

### Webhooks

```
POST /webhook/call-completed    # External integrations (11labs)
```

## 📊 Database Schema Integration

This system maps directly to your database schema:

### Tables Used

- `users` - User preferences, streaks, tone settings, onboarding status
- `onboarding` - V3 onboarding responses (JSONB format)
- `promises` - Daily promise tracking
- `call_recordings` - Generated audio storage
- `memory_embeddings` - Long-term pattern learning
- `identity_status` - User accountability tracking
- `identity` - Unified identity data with all psychological profiles

### Key Relationships

```
User → Identity (unified psychological profile)
User → Onboarding (raw responses)
User → Promises → CallRecordings
User → MemoryEmbeddings
User → IdentityStatus
```

## 🎯 Core Workflows

### V3 Onboarding Flow

1. **Anonymous Phase**: User completes 45-step onboarding (stored with sessionId)
2. **Payment Phase**: User pays via RevenueCat
3. **Authentication Phase**: User signs up via Supabase (Google/Apple)
4. **Data Migration**: Frontend calls `/onboarding/v3/complete`
5. **Unified Identity Extraction**: All responses extracted to `identity` table
6. **File Processing**: Audio/images uploaded to R2 cloud storage
7. **Voice Cloning**: Creates personalized voice using 11labs
8. **Completion**: User ready for daily calls with unified psychological profile

### Morning Call Flow

1. **Trigger Check**: Cron job identifies users in morning window
2. **Context Fetch**: Load user data, yesterday's promise, memories
3. **Tone Analysis**: Calculate optimal transmission mood
4. **Script Generation**: Create personalized call script
5. **TTS Processing**: Generate audio with voice clone
6. **Storage**: Save call recording and metadata

### Evening Call Flow

1. **Promise Check**: Verify today's promise completion
2. **Status Update**: Mark as kept/broken with excuse
3. **Consequence Generation**: Create appropriate response
4. **Memory Storage**: Embed excuse patterns for learning
5. **Streak Update**: Adjust alignment streak

### Promise Loop

```
Morning → Promise Creation → Day Progress → Evening Check → Consequence → Memory → Next Morning
```

## 🔊 File Processing & Storage

### Audio Processing

```typescript
// Frontend: Convert audio to base64
const base64Audio = await convertAudioToBase64(audioUri);

// Backend: Process and upload to R2
const result = await processOnboardingFiles(env, responses, userId);
// → { success: true, uploadedFiles: ["https://r2.cloudflare.com/..."] }
```

### Image Processing

```typescript
// Frontend: Convert custom images to base64
const base64Image = await convertImageToBase64(imageUri);

// Backend: Upload to R2 cloud storage
const uploadResult = await uploadImageToR2(env, imageBuffer, fileName);
// → { success: true, cloudUrl: "https://r2.cloudflare.com/..." }
```

### File Types Supported

- **Audio**: M4A, MP3, WAV (10MB limit)
- **Images**: JPEG, PNG, GIF (5MB limit)
- **Fallbacks**: Original URIs preserved if processing fails

## 🧠 Identity Extraction & Profiling

### Unified Identity Extraction

```typescript
// Extract all responses to Identity table
const identity = await extractAndSaveIdentityUnified(userId, env);
// → { success: true, identity: { identity_name, current_struggle, ... } }
```

### Direct Enhancement System

```typescript
// Use Identity data directly for prompt enhancement
const enhancedPrompt = enhancePromptWithOnboardingData(basePrompt, identity);
// → Enhanced prompt with all Identity fields directly integrated
```

### Memory & Pattern Recognition

```typescript
// Recent performance analysis
const analysis = analyzeRecentPerformance(recentPromises);
// → { success_rate, consecutive_failures, trend }

// Tone recommendation
const toneAnalysis = calculateOptimalTone(userContext);
// → { recommended_mood, reasoning, confidence_score }
```

## 🎪 Consequence Library

### Severity Levels

- **Light**: Supportive but direct feedback
- **Medium**: Pattern-focused intervention
- **Heavy**: Tough love and reality checks

### Dynamic Selection

```typescript
const consequences = getConsequenceLibrary("heavy");
const response = generateConsequenceScript(excuseText, "concerned");
```

## 🔄 Integration Points

### Frontend App

- Calls API endpoints for onboarding completion
- Receives call recordings for playback
- Displays streak and tone information
- Handles file uploads (audio/images)

### 11labs Integration

- Webhook receives call completion events
- Processes voice transcriptions
- Handles real-time conversation flow
- Voice cloning and TTS generation

### Storage

- Supabase for database operations
- R2/S3 for audio/image file storage
- Vector embeddings for memory system

## 📈 Monitoring & Debugging

### Logging

- All errors logged to Cloudflare Workers console
- User actions tracked with timestamps
- Performance metrics for API calls
- File processing status and errors

### Debug Endpoints

```
GET /debug/user/:userId    # User context inspection
```

### Health Checks

```
GET /stats
{
  "users_in_morning_window": 45,
  "users_in_evening_window": 23,
  "system_status": "operational",
  "file_processing": "active"
}
```

## 🚦 Error Handling

### Graceful Degradation

- TTS provider fallbacks
- Database connection retry logic
- Partial failure recovery
- File processing fallbacks

### Rate Limiting

- 1-second delays between batch calls
- Provider-specific rate limit handling
- Exponential backoff for retries

## 🔐 Security

### API Authentication

- Cloudflare Worker environment secrets
- Supabase Row Level Security (RLS)
- HTTPS-only communication
- JWT token validation

### Data Privacy

- No sensitive data in logs
- Encrypted audio storage
- Memory embeddings anonymized
- Secure file uploads

## 📱 Mobile App Integration

### Onboarding Flow

```typescript
// Complete onboarding with file processing
const result = await api.post("/onboarding/v3/complete", {
  state: { responses, userName, brotherName, ... }
});
// → { success: true, filesProcessed: 8, identityExtraction: {...} }
```

### Call Playback

```typescript
// Frontend receives audio URL from API
const callData = await fetch("/call/userId/morning");
// → { audio_url, duration_seconds, tone_used }
```

### Promise Management

```typescript
// Morning promise creation
await createPromise(userId, promiseText);

// Evening completion
await completePromise(promiseId, wasKept, excuseText);
```

## 🎯 Next Steps

1. **Deploy System**: Set up Cloudflare Worker with secrets
2. **Test Onboarding**: Verify V3 45-step flow with file processing
3. **Test Endpoints**: Verify API functionality
4. **Integrate Frontend**: Connect mobile app to API
5. **Configure Cron**: Enable scheduled triggers
6. **Monitor Performance**: Watch logs and metrics

## 📞 Support

For questions about this system:

- Check logs in Cloudflare Workers dashboard
- Review API endpoint responses
- Verify database schema alignment
- Test individual components in isolation
- Monitor file processing status

---

**The YOU+ Backend Engine**: Transforming accountability through intelligent onboarding, personalized voice cloning, and consequence-driven growth.
