import type { Overall, Service, UptimeFeed } from "../contract.js";

// Pure feed assembly, shared by this package's worker and by any other worker
// that keeps its own probe but wants to publish the same contract. Nothing
// here touches D1: the caller supplies the latest state per service and the
// per-day rollup rows, and gets the exact response body back.

export const WINDOW_DAYS = 90;
const DAY_SECONDS = 86_400;
/** The page re-reads the feed once a minute; the probe only writes every 20. */
export const FEED_CACHE_CONTROL = "public, max-age=60";

/** Latest probe state for one service, as the roster and the status table hold it. */
export interface FeedServiceInput {
  id: string | number;
  name: string;
  url: string;
  is_online: number | null;
  last_check: number | null;
  /** Raw probe error while down, or an already terse reason. See reasonFromError. */
  error?: string | null;
}

/** One per-UTC-day rollup row. `service_id` matches FeedServiceInput.id. */
export interface FeedDailyInput {
  service_id: string | number;
  day: string;
  checks: number;
  up_checks: number;
}

export function utcDay(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString().slice(0, 10);
}

export function pctOf(upChecks: number, checks: number): number | null {
  if (checks <= 0) return null;
  return Math.round((upChecks / checks) * 10000) / 100;
}

/** The WINDOW_DAYS UTC days ending today, oldest first. */
export function feedWindow(nowSeconds: number): string[] {
  const days: string[] = [];
  for (let offset = WINDOW_DAYS - 1; offset >= 0; offset--) {
    days.push(utcDay(nowSeconds - offset * DAY_SECONDS));
  }
  return days;
}

/**
 * Collapses a raw probe error into the terse public reason the contract
 * allows. The raw text can name internal hosts or runtime error classes, so
 * only three shapes ever leave the worker: `HTTP <status>`, `Timed out`, and
 * `Unreachable`. A terse reason passes through unchanged.
 */
export function reasonFromError(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (/^HTTP \d{3}$/.test(raw)) return raw;
  if (raw === "Timed out" || raw === "Unreachable") return raw;
  if (/abort|timed? ?out/i.test(raw)) return "Timed out";
  return "Unreachable";
}

export function overallOf(knownCount: number, downCount: number, total: number): Overall {
  // Nothing probed yet is not "all good" - say unknown rather than operational.
  if (knownCount === 0) return "unknown";
  if (downCount > 0 && downCount * 2 >= total) return "major_outage";
  if (downCount > 0) return "partial_outage";
  return "operational";
}

export function buildFeed(
  services: FeedServiceInput[],
  daily: FeedDailyInput[],
  nowSeconds: number = Math.floor(Date.now() / 1000),
): UptimeFeed {
  const windowDays = feedWindow(nowSeconds);
  const byServiceDay = new Map<string, FeedDailyInput>();
  for (const row of daily) {
    byServiceDay.set(`${row.service_id}:${row.day}`, row);
  }

  let downCount = 0;
  let knownCount = 0;

  const payload: Service[] = services.map((row) => {
    // is_online = 1 only ever follows a successful probe, and last_check
    // distinguishes never-checked (unknown) from checked-and-offline (down).
    let current: Service["current"] = "unknown";
    if (row.last_check != null) {
      current = row.is_online === 1 ? "up" : "down";
      knownCount++;
      if (current === "down") downCount++;
    }

    let windowChecks = 0;
    let windowUpChecks = 0;
    const days = windowDays.map((day) => {
      const hit = byServiceDay.get(`${row.id}:${day}`);
      const checks = hit ? hit.checks : 0;
      const upChecks = hit ? hit.up_checks : 0;
      windowChecks += checks;
      windowUpChecks += upChecks;
      return { day, checks, up_checks: upChecks, pct: pctOf(upChecks, checks) };
    });

    return {
      id: row.id,
      name: row.name,
      url: row.url,
      current,
      last_check: row.last_check,
      // Only meaningful while down; a stale error on an up row must not leak.
      reason: current === "down" ? reasonFromError(row.error) : null,
      uptime_pct: pctOf(windowUpChecks, windowChecks),
      days,
    };
  });

  return {
    generated_at: new Date(nowSeconds * 1000).toISOString(),
    window_days: WINDOW_DAYS,
    overall: overallOf(knownCount, downCount, payload.length),
    services: payload,
  };
}
