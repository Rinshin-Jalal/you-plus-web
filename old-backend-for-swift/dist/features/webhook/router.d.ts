import { Hono } from 'hono';
declare const webhookRouter: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
export default webhookRouter;
