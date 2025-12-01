import { Context } from "hono";
/**
 * 🧪 Test Identity Extraction with Mock Data
 *
 * POST /debug/identity-test
 * Body: { userId: string, mockLevel?: "basic" | "full" }
 */
export declare function postTestIdentityExtraction(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    mockLevel: any;
    extractionResult: {
        success: boolean;
        identity?: any;
        error?: string | undefined;
    };
    mockResponsesCount: number;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">)>;
/**
 * 🗑️ Clear Test Data
 *
 * DELETE /debug/identity-test/:userId
 */
export declare function deleteTestIdentityData(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">)>;
