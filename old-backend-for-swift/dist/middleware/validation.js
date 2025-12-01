import { z } from "zod";
import { ErrorResponseSchema } from "@/types/validation";
/**
 * Validates JSON request body against a Zod schema
 */
export const validateJson = (schema) => {
    return async (c, next) => {
        try {
            const body = await c.req.json();
            const validatedData = schema.parse(body);
            // Store validated data in context for handlers to use
            c.set("validatedBody", validatedData);
            await next();
            return;
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const errorDetails = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                const errorResponse = ErrorResponseSchema.parse({
                    success: false,
                    error: "Invalid request data",
                    details: `Validation failed: ${error.errors.map(e => e.message).join(', ')}`,
                    validationErrors: errorDetails,
                });
                return c.json(errorResponse, 400);
            }
            // Handle JSON parsing errors
            if (error instanceof SyntaxError) {
                const errorResponse = ErrorResponseSchema.parse({
                    success: false,
                    error: "Invalid JSON",
                    details: "Request body contains invalid JSON",
                });
                return c.json(errorResponse, 400);
            }
            // Handle other errors
            const errorResponse = ErrorResponseSchema.parse({
                success: false,
                error: "Request validation failed",
                details: error instanceof Error ? error.message : "Unknown error",
            });
            return c.json(errorResponse, 500);
        }
    };
};
/**
 * Validates URL parameters against a Zod schema
 */
export const validateParams = (schema) => {
    return async (c, next) => {
        try {
            const params = c.req.param();
            const validatedParams = schema.parse(params);
            // Store validated params in context
            c.set("validatedParams", validatedParams);
            await next();
            return;
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const errorDetails = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                const errorResponse = ErrorResponseSchema.parse({
                    success: false,
                    error: "Invalid URL parameters",
                    details: `Parameter validation failed: ${error.errors.map(e => e.message).join(', ')}`,
                    validationErrors: errorDetails,
                });
                return c.json(errorResponse, 400);
            }
            const errorResponse = ErrorResponseSchema.parse({
                success: false,
                error: "Parameter validation failed",
                details: error instanceof Error ? error.message : "Unknown error",
            });
            return c.json(errorResponse, 500);
        }
    };
};
/**
 * Validates query parameters against a Zod schema
 */
export const validateQuery = (schema) => {
    return async (c, next) => {
        try {
            const query = Object.fromEntries(Object.entries(c.req.queries()));
            const validatedQuery = schema.parse(query);
            // Store validated query in context
            c.set("validatedQuery", validatedQuery);
            await next();
            return;
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const errorDetails = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                const errorResponse = ErrorResponseSchema.parse({
                    success: false,
                    error: "Invalid query parameters",
                    details: `Query validation failed: ${error.errors.map(e => e.message).join(', ')}`,
                    validationErrors: errorDetails,
                });
                return c.json(errorResponse, 400);
            }
            const errorResponse = ErrorResponseSchema.parse({
                success: false,
                error: "Query validation failed",
                details: error instanceof Error ? error.message : "Unknown error",
            });
            return c.json(errorResponse, 500);
        }
    };
};
/**
 * Validates response data against a Zod schema
 * This middleware wraps the response to ensure it matches the expected schema
 */
export const validateResponse = (schema) => {
    return async (c, next) => {
        // Store original json method
        const originalJson = c.json.bind(c);
        // Override json method to validate response
        c.json = ((data, init) => {
            try {
                const validatedData = schema.parse(data);
                return originalJson(validatedData, init);
            }
            catch (error) {
                if (error instanceof z.ZodError) {
                    console.error("Response validation failed:", error.errors);
                    const errorResponse = ErrorResponseSchema.parse({
                        success: false,
                        error: "Internal server error",
                        details: "Response validation failed",
                    });
                    return originalJson(errorResponse, 500);
                }
                console.error("Response validation error:", error);
                const errorResponse = ErrorResponseSchema.parse({
                    success: false,
                    error: "Internal server error",
                    details: "Response validation error",
                });
                return originalJson(errorResponse, 500);
            }
        });
        await next();
        return;
    };
};
/**
 * Type-safe helper to get validated data from context
 */
export const getValidatedBody = (c) => {
    const body = c.get("validatedBody");
    if (!body) {
        throw new Error("No validated body found in context. Make sure to use validateJson middleware.");
    }
    return body;
};
export const getValidatedParams = (c) => {
    const params = c.get("validatedParams");
    if (!params) {
        throw new Error("No validated params found in context. Make sure to use validateParams middleware.");
    }
    return params;
};
export const getValidatedQuery = (c) => {
    const query = c.get("validatedQuery");
    if (!query) {
        throw new Error("No validated query found in context. Make sure to use validateQuery middleware.");
    }
    return query;
};
/**
 * Compose multiple validation middlewares
 */
export const validate = {
    json: validateJson,
    params: validateParams,
    query: validateQuery,
    response: validateResponse,
};
