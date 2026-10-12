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

/**
 * A feed-level message for visitors, such as a hosting-provider incident that
 * explains a wave of failures. The producer writes the text; the page shows it.
 */
export type FeedNotice = {
  /** Free-form category, e.g. "provider_incident" or "provider_degraded". */
  kind: string;
  message: string;
  /** Where to read more; null when there is no link. */
  url: string | null;
  /** ISO 8601 time the condition started. */
  started_at: string;
};

export type UptimeFeed = {
  generated_at: string;
  window_days: number;
  overall: Overall;
  services: Service[];
  /** Optional: older feeds omit it, and a missing field means no notice. */
  notice?: FeedNotice | null;
};
