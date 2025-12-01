export { generateEmbedding, generateBatchEmbeddings, cosineSimilarity, findSimilarMemories, } from "@/services/embedding-services/core";
export { getMemoryEmbeddings, createMemoryEmbedding, searchMemoryEmbeddings, searchPsychologicalPatterns, } from "@/services/embedding-services/memory";
export { generateIdentityMemoryEmbeddings, updateIdentityMemoryEmbeddings, } from "@/services/embedding-services/identity";
export { extractCallPsychologicalContent, generateCallMemoryEmbeddings, } from "@/services/embedding-services/calls";
export { findExcusePatterns, findBreakthroughMoments, } from "@/services/embedding-services/patterns";
export { detectBehavioralPatterns, analyzeCallSuccess, trackUserPromisePatterns, correlateIdentityWithCalls, } from "@/services/embedding-services/behavioral";
import { createMemoryEmbedding } from "@/services/embedding-services/memory";
export declare const saveMemoryEmbedding: typeof createMemoryEmbedding;
