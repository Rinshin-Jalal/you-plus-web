import type { MiddlewareHandler } from "hono";
import type { ZodTypeAny } from "zod";

interface ZodMiddlewareOptions {
  /**
   * The key to store validated data under via `c.set(key, data)`.
   * Defaults:
   * - json: "validatedJson"
   * - params: "validatedParams"
   */
  key?: string;
  /**
   * Top-level error message returned to the client on validation failure.
   */
  errorMessage?: string;
}

export function zodJson<TSchema extends ZodTypeAny>(
  schema: TSchema,
  options: ZodMiddlewareOptions = {}
): MiddlewareHandler {
  const key = options.key ?? "validatedJson";
  const errorMessage = options.errorMessage ?? "Invalid request body";

  return async (c, next) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: errorMessage, details: parsed.error.flatten() },
        400
      );
    }

    c.set(key, parsed.data);
    await next();
  };
}

export function zodParams<TSchema extends ZodTypeAny>(
  schema: TSchema,
  options: ZodMiddlewareOptions = {}
): MiddlewareHandler {
  const key = options.key ?? "validatedParams";
  const errorMessage = options.errorMessage ?? "Invalid route parameters";

  return async (c, next) => {
    const params = c.req.param();
    const parsed = schema.safeParse(params);

    if (!parsed.success) {
      return c.json(
        { error: errorMessage, details: parsed.error.flatten() },
        400
      );
    }

    c.set(key, parsed.data);
    await next();
  };
}

