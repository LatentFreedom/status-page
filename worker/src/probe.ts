import config from "../../status.config";
import type { Env } from "./env";

// Reachability probe. Runs on the cron trigger (see wrangler.jsonc) and on
// demand via POST /api/v1/probe. It fetches each configured service and
// writes the result to service_status (latest state), reachability_checks
// (raw log, self-pruned) and reachability_daily (the per-UTC-day rollup the
// public feed reads - see feed.ts).

const REQUEST_TIMEOUT_MS = 8000;
// Bounded concurrency keeps us well under the Workers simultaneous-connection ceiling.
const CONCURRENCY = 15;
// Cloudflare caps subrequests per Worker invocation (50 on the free plan). Each
// probe is one subrequest, plus a couple for the D1 read/write. So each run
// checks only the stalest BATCH_LIMIT services and the cron rotates through the
// rest over the next ticks.
const BATCH_LIMIT = 40;
// Raw checks are only kept long enough to cover the feed's 90-day window with
// slack; the per-day rollup is what the feed actually reads.
const HISTORY_RETENTION_DAYS = 100;

interface StatusRow {
  service_id: string;
  is_online: number | null;
  last_check: number | null;
}

interface ProbeTarget {
  id: string;
  name: string;
  url: string;
  last_check: number | null;
}

interface ProbeResult {
  id: string;
  url: string;
  isOnline: boolean;
  responseTimeMs: number | null;
  /** Terse public cause while down ("HTTP 503", "Timed out", "Unreachable"); null when up. */
  reason: string | null;
  /** Raw detail for the reachability_checks log; never published. */
  error?: string;
}

export interface ProbeSummary {
  checked: number;
  online: number;
  offline: number;
  durationMs: number;
  errors: { url: string; error: string | undefined }[];
}

// A service url may be written without a scheme (e.g. "example.com").
// Default to https so the probe targets the real endpoint.
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function probe(target: ProbeTarget): Promise<ProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const response = await fetch(normalizeUrl(target.url), {
      method: "GET",
      // Do not follow redirects: each hop is another subrequest against the
      // per-invocation cap, and a 3xx already tells us the origin is serving.
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "status-page-probe/1.0 (+https://github.com/LatentFreedom/status-page)",
      },
    });
    const responseTimeMs = Date.now() - startedAt;
    // Online = the server answered with a success or redirect status. A 4xx/5xx
    // means the origin is reachable but not serving, which counts as down for a
    // status page. With manual redirect, Workers returns the real 3xx status
    // here, so this branch covers redirects without following them.
    const isOnline = response.status >= 200 && response.status < 400;
    if (isOnline) {
      return { id: target.id, url: target.url, isOnline, responseTimeMs, reason: null };
    }
    // The status IS the public reason, and it goes to the raw log too so
    // status-based downs are as inspectable as network failures.
    const reason = `HTTP ${response.status}`;
    return { id: target.id, url: target.url, isOnline, responseTimeMs, reason, error: reason };
  } catch (err) {
    // Timeout, DNS failure, refused connection, TLS error: unreachable.
    // Workers fetch errors are too generic to distinguish those publicly,
    // so the reason stays at two buckets; the raw detail goes to the log.
    const timedOut = err instanceof Error && err.name === "AbortError";
    return {
      id: target.id,
      url: target.url,
      isOnline: false,
      responseTimeMs: null,
      reason: timedOut ? "Timed out" : "Unreachable",
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

// Simple bounded worker pool: at most CONCURRENCY probes in flight at once.
async function probeAll(targets: ProbeTarget[]): Promise<ProbeResult[]> {
  const results: ProbeResult[] = [];
  let next = 0;
  async function worker(): Promise<void> {
    while (next < targets.length) {
      const index = next++;
      results.push(await probe(targets[index]));
    }
  }
  const workers = Array.from(
    { length: Math.min(CONCURRENCY, targets.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

export async function runProbe(env: Env): Promise<ProbeSummary> {
  const startedAt = Date.now();

  // The roster IS the config; D1 only stores state and history keyed by
  // service id. Stalest first (never-checked services lead), capped at
  // BATCH_LIMIT to stay under the subrequest ceiling.
  const { results: statusRows } = await env.DB.prepare(
    "SELECT service_id, is_online, last_check FROM service_status",
  ).all<StatusRow>();
  const lastCheckById = new Map(
    (statusRows || []).map((r) => [r.service_id, r.last_check]),
  );

  const targets: ProbeTarget[] = config.services
    .map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      last_check: lastCheckById.get(s.id) ?? null,
    }))
    .sort((a, b) => (a.last_check ?? -1) - (b.last_check ?? -1))
    .slice(0, BATCH_LIMIT);

  if (targets.length === 0) {
    return {
      checked: 0,
      online: 0,
      offline: 0,
      durationMs: Date.now() - startedAt,
      errors: [],
    };
  }

  const probes = await probeAll(targets);
  const nowEpochSeconds = Math.floor(Date.now() / 1000);

  // One prepared statement reused per row, batched into a single D1
  // transaction. The history writes MUST ride in this same batch: the probe
  // fetches already spend most of the subrequest budget, so separate env.DB
  // calls per service would blow the ceiling.
  const upsertStatus = env.DB.prepare(
    `INSERT INTO service_status (service_id, is_online, last_check, response_time, reason)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(service_id) DO UPDATE SET
       is_online = excluded.is_online,
       last_check = excluded.last_check,
       response_time = excluded.response_time,
       reason = excluded.reason`,
  );
  const insertCheck = env.DB.prepare(
    "INSERT INTO reachability_checks (service_id, checked_at, is_online, response_time, error) VALUES (?, ?, ?, ?, ?)",
  );
  // Incremental mean over UP checks only, so a failed probe (which has no
  // response time) never drags the average and up_checks is the exact divisor.
  const upsertDay = env.DB.prepare(
    `INSERT INTO reachability_daily (service_id, day, checks, up_checks, avg_response_time)
     VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(service_id, day) DO UPDATE SET
       checks = reachability_daily.checks + 1,
       up_checks = reachability_daily.up_checks + excluded.up_checks,
       avg_response_time = CASE
         WHEN excluded.avg_response_time IS NULL THEN reachability_daily.avg_response_time
         WHEN reachability_daily.avg_response_time IS NULL OR reachability_daily.up_checks = 0 THEN excluded.avg_response_time
         ELSE (reachability_daily.avg_response_time * reachability_daily.up_checks + excluded.avg_response_time)
              / (reachability_daily.up_checks + 1)
       END`,
  );
  const day = new Date(nowEpochSeconds * 1000).toISOString().slice(0, 10);
  const batch: D1PreparedStatement[] = [];
  for (const p of probes) {
    batch.push(
      upsertStatus.bind(p.id, p.isOnline ? 1 : 0, nowEpochSeconds, p.responseTimeMs, p.reason),
    );
    batch.push(
      insertCheck.bind(p.id, nowEpochSeconds, p.isOnline ? 1 : 0, p.responseTimeMs, p.error ?? null),
    );
    batch.push(upsertDay.bind(p.id, day, p.isOnline ? 1 : 0, p.isOnline ? p.responseTimeMs : null));
  }
  // One prune per tick, in the same batch, so the raw log stays bounded
  // without its own D1 round trip.
  batch.push(
    env.DB.prepare("DELETE FROM reachability_checks WHERE checked_at < ?").bind(
      nowEpochSeconds - HISTORY_RETENTION_DAYS * 86400,
    ),
  );
  await env.DB.batch(batch);

  const online = probes.filter((p) => p.isOnline).length;
  return {
    checked: probes.length,
    online,
    offline: probes.length - online,
    durationMs: Date.now() - startedAt,
    errors: probes.filter((p) => p.error).map((p) => ({ url: p.url, error: p.error })),
  };
}
