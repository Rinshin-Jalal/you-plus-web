import { Env } from "@/index";
/**
 * 🔮 Generate AI Embedding Vector for Psychological Text
 *
 * Transforms psychological text (excuses, fears, commitments) into a 1536-dimensional
 * vector using OpenAI's text-embedding-ada-002 model. These vectors enable semantic
 * similarity search for pattern recognition and accountability leverage.
 *
 * @param text - Psychological content to vectorize (max 8191 tokens)
 * @param env - Environment with OPENAI_API_KEY
 * @returns 1536-dimensional vector array representing semantic meaning
 *
 * 💡 Use Cases:
 * • "I'm too tired" → [0.123, -0.456, 0.789...]
 * • Later: "I don't have energy" → Similar vector = Pattern detected!
 */
export declare function generateEmbedding(text: string, env: Env): Promise<number[]>;
/**
 * ⚡ Generate Multiple AI Embeddings in Single Request
 *
 * Efficiently processes multiple psychological texts in one API call for significant
 * cost and latency savings. Perfect for bulk identity data processing or initial
 * memory bank creation.
 *
 * @param texts - Array of psychological content to vectorize (max 2048 items)
 * @param env - Environment with OPENAI_API_KEY
 * @returns Array of 1536-dimensional vectors, maintaining input order
 *
 * 💰 Cost Optimization:
 * • Single request vs. multiple = ~50% latency reduction
 * • Batch processing = More efficient token usage
 * • Ideal for identity table → memory embeddings conversion
 */
export declare function generateBatchEmbeddings(texts: string[], env: Env): Promise<number[][]>;
/**
 * 📐 Calculate Cosine Similarity Between Two Embedding Vectors
 *
 * Computes semantic similarity between psychological content using vector math.
 * Returns score from -1 (opposite) to 1 (identical), with 0 being unrelated.
 * Used for local similarity computation without database queries.
 *
 * @param vecA - First embedding vector (1536 dimensions)
 * @param vecB - Second embedding vector (1536 dimensions)
 * @returns Similarity score: 1 = identical, 0 = unrelated, -1 = opposite
 *
 * 🧮 Mathematical Process:
 * 1. Dot Product: Sum of element-wise multiplication
 * 2. Vector Norms: Magnitude of each vector
 * 3. Cosine Similarity: dot(A,B) / (||A|| * ||B||)
 *
 * 💡 Psychological Interpretation:
 * • 0.9+ = "You said the exact same thing before"
 * • 0.7+ = "This sounds familiar to your past pattern"
 * • 0.5+ = "Similar theme to something you've mentioned"
 */
export declare function cosineSimilarity(vecA: number[], vecB: number[]): number;
/**
 * 🎯 Find Similar Memories from Local Memory Array
 *
 * Performs client-side similarity search across an array of memory embeddings.
 * Useful when you already have memories loaded and want to avoid database queries.
 * Returns ranked results above similarity threshold.
 *
 * @param queryEmbedding - Current behavior/content embedding to match
 * @param memories - Array of memory objects with embeddings and content
 * @param threshold - Minimum similarity score to include (default: 0.8)
 * @returns Ranked array of similar memories with similarity scores
 *
 * 🔍 Perfect for:
 * • Batch processing already-loaded memories
 * • Real-time pattern matching during calls
 * • Local similarity computation without DB roundtrips
 * • Custom filtering and ranking logic
 *
 * 📊 Processing Steps:
 * 1. Calculate similarity score for each memory
 * 2. Filter results above threshold
 * 3. Sort by similarity (highest first)
 * 4. Return ranked matches for accountability use
 */
export declare function findSimilarMemories(queryEmbedding: number[], memories: Array<{
    embedding: number[];
    text_content: string;
    id: string;
}>, threshold?: number): Array<{
    id: string;
    text_content: string;
    similarity: number;
}>;
