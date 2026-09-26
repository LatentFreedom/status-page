/**
 * Types and helpers for the uptime feed.
 *
 * The feed (CONTRACT.md in this package) is the single source of truth for
 * which services exist and how they are doing. It can come from this package's
 * worker, whose roster is the instance's status.config.ts, or from any other
 * endpoint that implements the contract.
 */

export type {
  DayBucket,
  Overall,
  Service,
  ServiceState,
  UptimeFeed,
} from "./contract.js";
import type { DayBucket, Service, UptimeFeed } from "./contract.js";

export const WINDOW_DAYS = 90;

/** How often the page re-reads the feed. The feed sets max-age=60 to match. */
export const REFRESH_MS = 60_000;

/**
 * The build-time override wins over the config so one instance can point a
 * preview build at a local worker without editing status.config.ts.
 */
export function resolveApiBase(configApiBase: string): string {
  return process.env.NEXT_PUBLIC_UPTIME_API ?? configApiBase;
}

export async function fetchUptime(
  apiBase: string,
  signal?: AbortSignal,
): Promise<UptimeFeed> {
  const res = await fetch(`${apiBase}/uptime`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`uptime feed responded ${res.status}`);
  return (await res.json()) as UptimeFeed;
}

export type Tone = "ok" | "warn" | "down" | "nodata";

/** A day with no checks is unknown, not an outage - grey, never red. */
export function barTone(pct: number | null): Tone {
  if (pct === null) return "nodata";
  if (pct >= 99.5) return "ok";
  if (pct >= 95) return "warn";
  return "down";
}

function shiftDay(day: string, deltaDays: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Always render exactly WINDOW_DAYS bars. A young service has fewer buckets, and
 * the missing days are older than its history - so they pad on the LEFT and read
 * as "no data", which is true, rather than shifting the strip's timeline.
 */
export function padDays(days: DayBucket[]): DayBucket[] {
  const missing = WINDOW_DAYS - days.length;
  if (missing <= 0) return days.slice(-WINDOW_DAYS);
  const first = days[0]?.day;
  const pad: DayBucket[] = Array.from({ length: missing }, (_, i) => ({
    day: first ? shiftDay(first, i - missing) : `pad-${i}`,
    checks: 0,
    up_checks: 0,
    pct: null,
  }));
  return [...pad, ...days];
}

/** "2026-08-27" -> "Aug 27, 2026". Left-pad placeholder keys pass through as-is. */
export function formatDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Down first so an outage is the first thing read, then alphabetical. */
export function sortServices(services: Service[]): Service[] {
  return [...services].sort((a, b) => {
    const rank = (s: Service) => (s.current === "down" ? 0 : 1);
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });
}

export function downCount(services: Service[]): number {
  return services.filter((s) => s.current === "down").length;
}

export function bannerText(feed: UptimeFeed): string {
  const total = feed.services.length;
  const down = downCount(feed.services);
  switch (feed.overall) {
    case "operational":
      return "All systems operational";
    case "partial_outage":
      return `Partial outage - ${down} of ${total} services down`;
    case "major_outage":
      return `Major outage - ${down} of ${total} services down`;
    default:
      return "No data yet";
  }
}

/** Relative age of the last probe. `now` is injectable so tests are not clock-bound. */
export function checkedAgo(
  lastCheck: number | null,
  now: number = Date.now(),
): string | null {
  if (!lastCheck) return null;
  const minutes = Math.floor((now - lastCheck * 1000) / 60_000);
  if (minutes < 1) return "Checked just now";
  if (minutes < 60) return `Checked ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Checked ${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `Checked ${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatPct(pct: number | null): string {
  return pct === null ? "-" : `${pct.toFixed(2)}%`;
}
