import { handleFeed } from "./feed";
import { runProbe } from "./probe";
import type { Env } from "./env";

// The status page is usually served from a different origin than this worker
// (Pages domain vs workers.dev), and the feed is public read-only data, so a
// wildcard is both required and safe.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const { pathname } = new URL(request.url);

    if (pathname === "/api/v1/uptime") {
      return handleFeed(request, env, CORS_HEADERS);
    }

    if (pathname === "/api/v1/probe" && request.method === "POST") {
      // Deploy-time convenience: trigger the first probe instead of waiting
      // for the cron. Requires the PROBE_SECRET wrangler secret to be set.
      const auth = request.headers.get("Authorization");
      if (!env.PROBE_SECRET || auth !== `Bearer ${env.PROBE_SECRET}`) {
        return json({ error: "Unauthorized" }, 401);
      }
      return json(await runProbe(env));
    }

    return json({ error: "Not Found" }, 404);
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runProbe(env));
  },
};
