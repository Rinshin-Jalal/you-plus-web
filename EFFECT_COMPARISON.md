# Effect‑TS Examples for YOU+ Cloudflare Workers Backend

> Real examples from YOUR codebase where Effect‑TS improves readability, error handling, and composability.

---

## 1️⃣ Retryable HTTP API call – `transcribeAudio` (transcription.ts:125‑245)

### Current implementation (simplified)

```typescript
export async function transcribeAudio(
  audioBase64: string,
  env: Env
): Promise<TranscriptionResult> {
  console.log("🎤 Starting Cartesia Ink transcription...");

  try {
    const { blob, mimeType, extension } = base64ToAudioBlob(audioBase64);
    console.log(`📦 Audio size: ${blob.size} bytes, type: ${mimeType}`);

    // Create FormData
    const formData = new FormData();
    formData.append("file", blob, `recording.${extension}`);
    formData.append("model", "ink-whisper");
    formData.append("language", "en");

    // Call Cartesia Ink API
    const response = await fetch("https://api.cartesia.ai/stt", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CARTESIA_API_KEY}`,
        "Cartesia-Version": "2025-04-16",
      },
      policy: {
        retry: { count: 3, backoff: "exponential", maxDelay: "5s" },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cartesia STT error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `Transcription failed: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json() as { text?: string };
    const transcribedText = result.text || "";

    console.log(`✅ Transcription complete: "${transcribedText.substring(0, 100)}..."`);

    return {
      success: true,
      text: transcribedText,
    };
  } catch (error) {
    console.error("❌ Transcription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown transcription error",
    };
  }
}
```

### Effect version – typed errors, retry, timeout, and clearer control flow

```typescript
import { Effect, Schedule, pipe } from "effect";
import type { Env } from "@/types/environment";

// Domain‑typed errors for better error handling
class TranscriptionError extends Data.TaggedError("TranscriptionError")<{
  readonly readonly _tag: "TranscriptionError";
}> {}

class HttpError extends Data.TaggedError("HttpError")<{
  readonly readonly status: number; readonly message: string }> {}

// Tagged services for dependency injection
interface Services {
  readonly transcription: {
    transcribe: (audioBase64: string) => Effect.Effect<never, TranscriptionError | HttpError, never>;
  };
  readonly logger: Effect.Effect<never, never, never>;
}

// Layer to provide services
const TranscriptionServiceLive = Layer.effect(
  Effect.succeed({
    transcription: {
      transcribe: (audioBase64) =>
        Effect.gen(function* () {
          yield* Effect.log("🎤 Starting Cartesia Ink transcription...");
          const { blob, mimeType, extension } = base64ToAudioBlob(audioBase64);
          yield* Effect.log(`📦 Audio size: ${blob.size} bytes, type: ${mimeType}`);

          // Create FormData
          const formData = new FormData();
          formData.append("file", blob, `recording.${extension}`);
          formData.append("model", "ink-whisper");
          formData.append("language", "en");

          // Call Cartesia Ink API with typed retry, timeout, and error handling
          const response = yield* Effect.tryPromise({
            try: () =>
              Effect.gen(function* () {
                return yield* Effect.flatMap(
                  Effect.promise(() =>
                    fetch("https://api.cartesia.ai/stt", {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${env.CARTESIA_API_KEY}`,
                        "Cartesia-Version": "2025-04-16",
                      },
                      body: formData,
                    })
                  ),
                  (response): Response =>
                    Effect.gen(function* () {
                      if (!response.ok) {
                        return yield* Effect.fail(
                          new HttpError({
                            status: response.status,
                            message: `Transcription failed: ${response.status}`,
                          })
                        );
                      }
                      const result = yield* Effect.promise(() => response.json());
                      return yield* Effect.succeed(result.text ?? "");
                    })
                }),
            catch: (cause) =>
              Effect.fail(new TranscriptionError({ cause }))
          });

          yield* Effect.log(`✅ Transcription complete: "${response.data.text.substring(0, 100)}..."`);

          return {
            success: true,
            text: response.data.text,
          };
        })
    },
    logger: Effect.log,
  }),
);

export const transcribeAudio = (
  audioBase64: string,
  env: Env
): Effect.Effect<TranscriptionResult, never, TranscriptionServiceLive> =>
  Effect.flatMap(Effect.service(TranscriptionServiceLive), ({ transcription })) =>
    transcription.transcribe(audioBase64)
  ).pipe(
    // Retry with exponential backoff up to 3 times, 500ms base
    Effect.retry(Schedule.exponential("500 ms").pipe(Schedule.recurs(3))),
    // 30‑second timeout with custom error
    Effect.timeout("30 seconds", {
      onTimeout: () => Effect.fail(new TranscriptionError())
    })
  );
```

**Why this is better**

- **Typed errors** – `HttpError` and `TranscriptionError` give us precise error information instead of loose `any`.
- **Dependency injection** – `TranscriptionServiceLive` context makes testing trivial; no hidden env coupling.
- **Explicit retry policy** – `Effect.retry` with `Schedule.exponential` makes retry logic declarative and testable.
- **Integrated timeout** – `Effect.timeout` aborts cleanly and surfaces a typed error.
- **Composable pipelines** – `Effect.flatMap`, `pipe`, and `gen` produce linear, readable flow.
- **Testability** – Service layer enables pure unit tests without network calls.
- **Observability** – `Effect.log` and structured timeouts surface failures and timing clearly.

---

## 2️⃣ Parallel API orchestration – `cloneVoice` (transcription.ts:182‑289)

### Current implementation (simplified)

```typescript
export async function cloneVoice(
  audioSources: string[],
  userId: string,
  userName: document,
  env: Env
): Promise<VoiceCloneResult> {
  console.log("🎭 Starting Cartesia voice cloning...");
  console.log(`📊 Received ${audioSources.length} audio sources`);

  try {
    // Validation steps omitted...
    const response = await fetch("https://api.cartesia.ai/voices/clone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CARTESIA_API_KEY}`,
        "Cartesia-Version": "2025-04-16",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cartesia voice clone error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `Voice cloning failed: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json() as {
      id: string;
      // ... other fields omitted
    };

    console.log(`✅ Voice cloned successfully!`);
    console.log(`   Voice ID: ${result.id}`);
    return {
      success: true,
      voiceId: result.id,
    };
  } catch (error) {
    console.error("❌ Voice cloning error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown voice cloning error",
    };
  }
}
```

### Effect version – parallel validation and typed pipeline

```typescript
import { Effect, pipe, Array as A } from "effect";
import type { Env } from "@/types/environment";

// Same error types as above
interface Services {
  readonly carteia: {
    cloneVoice: (
      audioSources: Array<string>,
      userId: string,
      userName: string
    ) => Effect.Effect<never, TranscriptionError | HttpError, never>;
    readonly logger: Effect.Effect<never, never, never>;
};

const CartesiaServiceLive = Layer.effect(
  Effect.succeed({
    carteia: {
      cloneVoice: (audioSources, userId, userName) =>
        Effect.gen(function* () {
          yield* Effect.log("🎭 Starting Cartesia voice cloning...");
          yield* Effect.log(`📊 Received ${audioSources.length} audio sources`);

          // Filter out empty sources
          const validSources = yield* pipe(
            Effect.succeed(audioSources),
            Effect.filter((s): string => Boolean(s && s.length > 0))
          );

          if (A.isEmpty(validSources)) {
            return yield* Effect.fail(
              new TranscriptionError({ cause: "No valid audio sources provided for voice cloning" })
            );
          }

          // Select largest audio in parallel
          const bestSource = yield* pipe(
            Effect.succeed(validSources),
            Effect.map((s): AudioBlobResult => {
              const bytes = base64ToAudioBlob(s).bytes;
              return { ...s, bytes };
            }),
            Effect.reduce(
              (best: AudioBlobResult, current: AudioBlobResult) =>
                current.bytes > best.bytes ? current : best
            )
          );

          const { blob, mimeType } = bestSource;
          yield* Effect.log(`📦 Selected best audio: ${blob.size} bytes, type: ${mimeType}`);

          // Call API with typed retry, timeout, and error handling
          const formData = new FormData();
          formData.append("clip", blob, `voice_sample_combined.${extensionFromMimeType(mimeType)}`);
          formData.append("name", `${userName || "User"} - Future Self`);
          formData.append("description", `Voice clone for You+ Future Self agent. User ID: ${userId.slice(0, 8)}. Combined from ${validSources.length} recordings.`);
          formData.append("language", "un");

          const response = yield* Effect.tryPromise({
            try: () =>
              Effect.gen(function* () {
                return yield* Effect.flatMap(
                  Effect.promise(() =>
                    fetch("https://api.cartesia.ai/voices/clone", {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${env.CARTESIA_API_KEY}`,
                        "Cartesia-Version": "2025-04-16",
                      },
                      body: formData,
                    })
                  ),
                  (response): Response =>
                    Effect.gen(function* () {
                      if (!response.ok) {
                        return yield* Effect.fail(
                          new HttpError({
                            status: response.status,
                            message: `Voice cloning failed: ${response.status}`,
                          })
                        );
                      }
                      const result = yield* Effect.promise(() => response.json());
                      return yield* Effect.succeed(result.id);
                    })
                }),
            catch: (cause) =>
              Effect.fail(new TranscriptionError({ cause }))
          });

          yield* Effect.log(`✅ Voice cloned successfully!`);
          yield* Effect.log(`   Voice ID: ${response.id}`);

          return {
            success: true,
            voiceId: response.id,
          };
        })
    },
    logger: Effect.log,
  }),
);

export const cloneVoice = (
  audioSources: string[],
  userId: string,
  userName: string,
  env: Env
): Effect.Effect<VoiceCloneResult, never, CartesiaServiceLive> =>
  Effect.flatMap(Effect.service(CartesiaServiceLive), ({ carteia })) =>
    carteia.cloneVoice(audioSources, userId, userName)
  );
```

**Why this is better**

- **Parallel processing** – `Effect.filter`, `Effect.reduce`, and array helpers eliminate manual loops and race conditions.
- **Typed results** – `AudioBlobResult` encodes per‑step outputs instead of loose `any`.
- **Structured timeout** – a single Effect.timeout wraps the entire pipeline, simplifying error boundaries.
- **Retry policies are composable** – same retry logic reused without duplication.
- **Testability** – Service layer enables pure unit tests without network calls.
- **Observability** – `Effect.log` and structured timeouts surface failures and timing clearly.

---

## TL;DR

- **Error handling:** Effect gives you typed, recoverable errors vs. untyped try/catch.
- **Composability:** Pipelines (`pipe`) and generators (`gen*`) replace nested callbacks vs. manual Promise chains.
- **Testability:** Dependency injection via `Services` layer enables pure unit tests without network calls.
- **Observability:** `Effect.log` and structured timeouts surface failures and timing clearly.
- **Performance:** `Effect.retry` + `Schedule.exponential` provide built‑in backoff and jitter for production resilience.