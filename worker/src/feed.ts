import config from "../../status.config";
import type { Env } from "./env";

// Public, unauthenticated uptime feed: GET /api/v1/uptime.
//
// Renders one overall state plus a 90-day per-day rollup per service. It
// reads reachability_daily (written by probe.ts), never the raw check log,
// so the response cost stays flat as history accumulates. The exact JSON
// shape is documented in CONTRACT.md at the repo root.

const WINDOW_DAYS = 90;
const DAY_SECONDS = 86_400;
// The page rebuilds the strip at most once a minute; the probe only writes
// every 20.
const CACHE_CONTROL = "public, max-age=60";

interface StatusRow {
  service_id: string;
  is_online: number | null;
  last_check: number | null;
}

interface DailyRow {
  service_id: string;
  day: string;
  checks: number;
  up_checks: number;
}

interface DayCell {
  day: string;
  checks: number;
  up_checks: number;
  // null, not 0: a day nobody probed is unknown (grey), not a 0% outage.
  pct: number | null;
}

function utcDay(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString().slice(0, 10);
}

function pctOf(upChecks: number, checks: number): number | null {
  if (checks <= 0) return null;
  return Math.round((upChecks / checks) * 10000) / 100;
}

export async function handleFeed(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, Allow: "GET" },
    });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  // Oldest first, so the rendered strip reads left-to-right as time passes.
  const windowDays: string[] = [];
  for (let offset = WINDOW_DAYS - 1; offset >= 0; offset--) {
    windowDays.push(utcDay(nowSeconds - offset * DAY_SECONDS));
  }
  const windowStart = windowDays[0];

  const [status, daily] = await Promise.all([
    env.DB.prepare(
      "SELECT service_id, is_online, last_check FROM service_status",
    ).all<StatusRow>(),
    env.DB.prepare(
      `SELECT service_id, day, checks, up_checks FROM reachability_daily
       WHERE day >= ?
       ORDER BY day ASC`,
    )
      .bind(windowStart)
      .all<DailyRow>(),
  ]);

  const statusById = new Map(
    (status.results || []).map((row) => [row.service_id, row]),
  );
  const byServiceDay = new Map<string, DailyRow>();
  for (const row of daily.results || []) {
    byServiceDay.set(`${row.service_id}:${row.day}`, row);
  }

  let downCount = 0;
  let knownCount = 0;

  // The roster is the config, in config order; D1 only contributes history.
  const payload = config.services.map((service) => {
    const row = statusById.get(service.id);
    // is_online = 1 only ever follows a successful probe, and last_check
    // distinguishes never-checked (unknown) from checked-and-offline (down).
    let current: "up" | "down" | "unknown" = "unknown";
    if (row && row.last_check != null) {
      current = row.is_online === 1 ? "up" : "down";
      knownCount++;
      if (current === "down") downCount++;
    }

    let windowChecks = 0;
    let windowUpChecks = 0;
    const days: DayCell[] = windowDays.map((day) => {
      const hit = byServiceDay.get(`${service.id}:${day}`);
      const checks = hit ? hit.checks : 0;
      const upChecks = hit ? hit.up_checks : 0;
      windowChecks += checks;
      windowUpChecks += upChecks;
      return { day, checks, up_checks: upChecks, pct: pctOf(upChecks, checks) };
    });

    return {
      id: service.id,
      name: service.name,
      url: service.url,
      current,
      // Epoch seconds, exactly as service_status stores it.
      last_check: row?.last_check ?? null,
      uptime_pct: pctOf(windowUpChecks, windowChecks),
      days,
    };
  });

  // Nothing probed yet is not "all good" - say unknown rather than operational.
  let overall: "operational" | "partial_outage" | "major_outage" | "unknown";
  if (knownCount === 0) overall = "unknown";
  else if (downCount > 0 && downCount * 2 >= payload.length) overall = "major_outage";
  else if (downCount > 0) overall = "partial_outage";
  else overall = "operational";

  return new Response(
    JSON.stringify({
      generated_at: new Date(nowSeconds * 1000).toISOString(),
      window_days: WINDOW_DAYS,
      overall,
      services: payload,
    }),
    { headers: { ...corsHeaders, "Cache-Control": CACHE_CONTROL } },
  );
}
