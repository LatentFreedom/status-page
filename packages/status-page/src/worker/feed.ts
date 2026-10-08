import type { ServiceConfig } from "../config.js";
import type { Env } from "./env.js";
import {
  buildFeed,
  FEED_CACHE_CONTROL,
  feedWindow,
  type FeedDailyInput,
} from "./build-feed.js";

// Public, unauthenticated uptime feed: GET /api/v1/uptime.
//
// Reads the latest state per service plus reachability_daily (written by
// probe.ts), never the raw check log, so the response cost stays flat as
// history accumulates. Assembly lives in build-feed.ts; this file only
// knows the D1 schema. The JSON shape is documented in CONTRACT.md.

interface StatusRow {
  service_id: string;
  is_online: number | null;
  last_check: number | null;
  reason: string | null;
}

export async function handleFeed(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  services: ServiceConfig[],
): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, Allow: "GET" },
    });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStart = feedWindow(nowSeconds)[0];

  const [status, daily] = await Promise.all([
    env.DB.prepare(
      "SELECT service_id, is_online, last_check, reason FROM service_status",
    ).all<StatusRow>(),
    env.DB.prepare(
      `SELECT service_id, day, checks, up_checks FROM reachability_daily
       WHERE day >= ?
       ORDER BY day ASC`,
    )
      .bind(windowStart)
      .all<FeedDailyInput>(),
  ]);

  const statusById = new Map(
    (status.results || []).map((row) => [row.service_id, row]),
  );

  // The roster is the config, in config order; D1 only contributes history.
  const feed = buildFeed(
    services.map((service) => {
      const row = statusById.get(service.id);
      return {
        id: service.id,
        name: service.name,
        url: service.url,
        is_online: row?.is_online ?? null,
        last_check: row?.last_check ?? null,
        error: row?.reason ?? null,
      };
    }),
    daily.results || [],
    nowSeconds,
  );

  return new Response(JSON.stringify(feed), {
    headers: { ...corsHeaders, "Cache-Control": FEED_CACHE_CONTROL },
  });
}
