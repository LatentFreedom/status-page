export interface Env {
  DB: D1Database;
  /**
   * Optional wrangler secret. When set, POST /api/v1/probe with
   * `Authorization: Bearer <PROBE_SECRET>` runs a probe on demand -
   * handy right after deploy, instead of waiting for the first cron tick.
   */
  PROBE_SECRET?: string;
}
