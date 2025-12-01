import { createPromise, saveMemoryEmbedding } from "@/features/core/utils/database";
import { generateEmbedding } from "@/services/embedding-service";
import { validateJson } from "@/middleware/validation";
import { CreatePromiseRequestSchema, CreatePromiseResponseSchema } from "@/types/validation";
import { getValidatedBody } from "@/middleware/validation";
/**
 * Process morning promise creation with embedding generation
 * Moved from consequence-engine.ts to be closer to route handling
 */
async function processMorningPromise(userId, promiseText, env) {
    try {
        const promise = await createPromise(env, userId, promiseText);
        // Generate embedding for the promise
        const embedding = await generateEmbedding(promiseText, env);
        await saveMemoryEmbedding(env, userId, promise.id, "craving", promiseText, embedding);
        return {
            success: true,
            promise_id: promise.id,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error
                ? error.message
                : "Failed to create promise",
        };
    }
}
export const postToolCreatePromise = async (c) => {
    const body = getValidatedBody(c);
    const env = c.env;
    try {
        const result = await processMorningPromise(body.userId, body.promiseText, env);
        const response = CreatePromiseResponseSchema.parse({
            success: result.success,
            promiseId: result.promise_id,
            message: result.success
                ? "Promise created successfully"
                : "Promise creation failed",
        });
        return c.json(response);
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Promise creation failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
// Export with validation middleware
export const postToolCreatePromiseWithValidation = [
    validateJson(CreatePromiseRequestSchema),
    postToolCreatePromise,
];
