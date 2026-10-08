/**
 * The wire shape of GET /api/v1/uptime, documented in CONTRACT.md. Shared by
 * the page (which renders it), the worker (which builds it), and any other
 * feed that wants to drive the page.
 */

export type DayBucket = {
  day: string; // YYYY-MM-DD, UTC
  checks: number;
  up_checks: number;
  /** null means the day had zero checks - grey, never 0%. */
  pct: number | null;
};

export type ServiceState = "up" | "down" | "unknown";

export type Service = {
  /** Opaque; only used as a stable render key. */
  id: string | number;
  name: string;
  url: string;
  current: ServiceState;
  last_check: number | null; // unix seconds
  /** Terse cause while down ("HTTP 503", "Timed out"). Optional: older feeds omit it. */
  reason?: string | null;
  uptime_pct: number | null;
  days: DayBucket[];
};

export type Overall =
  | "operational"
  | "partial_outage"
  | "major_outage"
  | "unknown";

export type UptimeFeed = {
  generated_at: string;
  window_days: number;
  overall: Overall;
  services: Service[];
};
