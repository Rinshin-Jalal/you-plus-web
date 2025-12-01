/**
 * Type-Safe Usage Examples
 *
 * This file demonstrates how to use the new type-safe patterns throughout the application.
 * It shows practical examples of error handling, middleware, shared types, and external API validation.
 */
import { Hono } from "hono";
import { z } from "zod";
import { validateBody, validateQuery, requestIdMiddleware, errorHandlingMiddleware, getValidatedData } from "@/middleware/type-safe";
import { createError } from "@/types/errors";
import { SuccessResponseSchema, PaginationParamsSchema, PromiseSchema } from "@/types/shared";
import { ElevenLabsValidator } from "@/services/external-api-validator";
// Example: Type-safe route handler with validation
const app = new Hono();
// Apply global middleware
app.use("*", requestIdMiddleware);
app.use("*", errorHandlingMiddleware);
// Example 1: Promise creation with full type safety
const CreatePromiseSchema = z.object({
    text: z.string().min(1),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    category: z.string().optional(),
    targetTime: z.string().optional(),
});
app.post("/promises", validateBody(CreatePromiseSchema), async (c) => {
    try {
        const body = getValidatedData(c, "validatedBody");
        const requestId = c.get("requestId");
        // Simulate promise creation
        const promise = {
            id: crypto.randomUUID(),
            userId: "user-123",
            text: body.text,
            priority: body.priority || "medium",
            category: body.category || "general",
            targetTime: body.targetTime,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "pending",
            excuseText: undefined,
            isTimeSpecific: !!body.targetTime,
            createdDuringCall: false,
        };
        // Validate response with shared schema
        const responseSchema = SuccessResponseSchema(PromiseSchema);
        const response = responseSchema.parse({
            success: true,
            data: promise,
            message: "Promise created successfully",
            timestamp: new Date().toISOString(),
            requestId,
        });
        return c.json(response, 201);
    }
    catch (error) {
        // This will be caught by errorHandlingMiddleware
        throw createError.validation("Failed to create promise", error instanceof Error ? error.message : undefined);
    }
});
// Example 2: Paginated list with type safety
app.get("/promises", validateQuery(PaginationParamsSchema), async (c) => {
    const query = getValidatedData(c, "validatedQuery");
    const requestId = c.get("requestId");
    // Simulate paginated data
    const promises = Array.from({ length: query.limit }, (_, i) => ({
        id: crypto.randomUUID(),
        userId: "user-123",
        text: `Promise ${query.page * query.limit + i + 1}`,
        priority: "medium",
        category: "general",
        targetTime: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "pending",
        excuseText: undefined,
        isTimeSpecific: false,
        createdDuringCall: false,
    }));
    const total = 100; // Simulate total count
    const totalPages = Math.ceil(total / query.limit);
    const response = {
        success: true,
        data: {
            items: promises,
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages,
                hasNext: query.page < totalPages,
                hasPrev: query.page > 1,
            },
        },
        message: "Promises retrieved successfully",
        timestamp: new Date().toISOString(),
        requestId,
    };
    return c.json(response);
});
// Example 3: External API integration with validation
app.post("/voice/clone", validateBody(z.object({
    name: z.string(),
    audioData: z.string(), // Base64 encoded
})), async (c) => {
    const body = getValidatedData(c, "validatedBody");
    const requestId = c.get("requestId");
    try {
        // Simulate ElevenLabs API call
        const mockElevenLabsResponse = {
            voice_id: "voice-123",
            name: body.name,
            samples: [],
            category: "cloned",
            fine_tuning: {
                model_id: "model-123",
                is_allowed_to_fine_tune: true,
                finetuning_state: "not_started",
                verification_attempts: [],
                verification_failures: [],
                verification_attempts_count: 0,
                manual_verification_requested: false,
            },
            labels: {},
            description: undefined,
            preview_url: undefined,
            available_for_tiers: ["free"],
            settings: {
                stability: 0.5,
                similarity_boost: 0.5,
                use_speaker_boost: true,
            },
            sharing: {
                status: "private",
                liked_by_count: 0,
                cloned_by_count: 0,
                labels: {},
                created_at_unix: Date.now(),
            },
            safety_control: undefined,
            voice_verification: {
                requires_verification: false,
                is_verified: false,
                verification_failures: [],
                verification_attempts_count: 0,
            },
            permission_on_resource: "owner",
        };
        // Validate external API response
        const validatedResponse = ElevenLabsValidator.validateCloneResponse(mockElevenLabsResponse);
        const response = {
            success: true,
            data: validatedResponse,
            message: "Voice cloned successfully",
            timestamp: new Date().toISOString(),
            requestId,
        };
        return c.json(response, 201);
    }
    catch (error) {
        // External API validation errors are automatically handled
        throw createError.externalService("ElevenLabs", error);
    }
});
// Example 4: Error handling demonstration
app.get("/error-demo", async (c) => {
    const requestId = c.get("requestId");
    // Different types of errors
    const errorType = c.req.query("type");
    switch (errorType) {
        case "validation":
            throw createError.validation("Invalid input", "Field 'email' is required");
        case "not-found":
            throw createError.notFound("User", "user-123");
        case "unauthorized":
            throw createError.unauthorized("Invalid token");
        case "external":
            throw createError.externalService("OpenAI", new Error("API rate limit exceeded"));
        case "zod":
            // This will be caught and converted to AppError by errorHandlingMiddleware
            throw z.ZodError.create([
                {
                    code: z.ZodIssueCode.invalid_type,
                    expected: z.ZodParsedType.string,
                    received: z.ZodParsedType.number,
                    path: ["age"],
                    message: "Expected string, received number",
                },
            ]);
        default:
            return c.json({
                success: true,
                message: "No error triggered",
                timestamp: new Date().toISOString(),
                requestId,
            });
    }
});
// Example 5: Custom middleware with type safety
const requireAuth = () => {
    return async (c, next) => {
        const token = c.req.header("Authorization");
        if (!token || !token.startsWith("Bearer ")) {
            throw createError.unauthorized("Missing or invalid authorization header");
        }
        // Simulate token validation
        const userId = "user-123";
        c.set("userId", userId);
        await next();
    };
};
app.get("/protected", requireAuth(), async (c) => {
    const userId = c.get("userId");
    const requestId = c.get("requestId");
    return c.json({
        success: true,
        data: { userId },
        message: "Protected resource accessed",
        timestamp: new Date().toISOString(),
        requestId,
    });
});
export default app;
