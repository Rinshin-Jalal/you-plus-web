import { Env } from "@/index";
/**
 * 🎙️ Ingest Call Memories Automatically
 *
 * Called when a call record is inserted/updated with transcript data.
 * Extracts psychological content and creates memory embeddings.
 */
export declare function ingestCallMemories(callId: string, userId: string, env: Env): Promise<void>;
/**
 * 💔 Ingest Promise Memories Automatically
 *
 * Called when a promise is broken or excuse is added.
 * Creates memory embeddings for excuse patterns and broken commitments.
 */
export declare function ingestPromiseMemories(promiseId: string, userId: string, env: Env): Promise<void>;
