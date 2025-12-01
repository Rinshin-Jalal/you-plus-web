import { Context } from "hono";
/**
 * Test R2 upload with a small dummy audio file
 * GET /test-r2-upload
 */
export declare function testR2Upload(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    cloudUrl: string | undefined;
    fileName: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string | undefined;
    message: string;
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: any;
    stack: any;
}, 500, "json">)>;
/**
 * Test R2 bucket connection
 * GET /test-r2-connection
 */
export declare function testR2Connection(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    availableBindings: string[];
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    environment: "production" | "development" | "staging";
    isLocalDevMode: boolean;
    criticalWarning: string | null;
    bucketInfo: {
        objectCount: any;
        truncated: any;
        totalObjects: any;
        objects: any;
    };
    warning: string | null;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: any;
    stack: any;
}, 500, "json">)>;
