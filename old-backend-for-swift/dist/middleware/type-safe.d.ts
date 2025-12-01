/**
 * Type-Safe Middleware Patterns
 *
 * This file provides reusable, type-safe middleware patterns for Hono applications.
 * It includes typed validation, error handling, and response formatting utilities.
 */
import type { Context, MiddlewareHandler } from "hono";
import { z } from "zod";
export declare const createValidationMiddleware: <TSchema extends z.ZodType>(schema: TSchema, source?: "body" | "params" | "query") => MiddlewareHandler;
export declare const requestIdMiddleware: MiddlewareHandler;
export declare const getValidatedData: <T>(c: Context, key: string) => T;
export declare const validateBody: <TSchema extends z.ZodType>(schema: TSchema) => MiddlewareHandler;
export declare const validateParams: <TSchema extends z.ZodType>(schema: TSchema) => MiddlewareHandler;
export declare const validateQuery: <TSchema extends z.ZodType>(schema: TSchema) => MiddlewareHandler;
export declare const createResponseWrapper: <T extends z.ZodType>(schema: T, successMessage?: string) => (data: z.infer<T>, status?: number) => {
    success: boolean;
    data: any;
    message: string | undefined;
    timestamp: string;
};
export declare const errorHandlingMiddleware: MiddlewareHandler;
