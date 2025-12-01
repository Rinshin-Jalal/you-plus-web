/**
 * Handler: POST /tool/search-memories
 *
 * Searches user memory embeddings by query.
 *
 * Request body:
 *   - userId: string
 *   - query: string
 *
 * Response:
 *   - success: boolean
 *   - memories: Array<object>
 *   - count: number
 *   - message: string
 */
import { Context } from "hono";
export declare function postToolSearchMemories(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    memories: any;
    count: any;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
