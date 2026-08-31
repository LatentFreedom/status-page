-- Uptime history behind the public feed (GET /api/v1/uptime).
--
-- The roster of services lives in status.config.ts, not here: D1 only stores
-- probe state and history keyed by the config's service ids. Removing a
-- service from the config simply orphans its rows (the feed never reads
-- them; the raw log self-prunes at 100 days).
--
-- service_status holds the LATEST probe result per service.
-- reachability_checks is the raw log (pruned to 100 days by the probe itself);
-- reachability_daily is the per-UTC-day rollup the feed actually reads, so the
-- endpoint never scans the raw log.

CREATE TABLE service_status (
  service_id TEXT PRIMARY KEY,
  -- 1 only ever after a successful probe, so it is an unambiguous "was up"
  -- signal; last_check distinguishes never-checked from checked-offline.
  is_online INTEGER,
  last_check INTEGER, -- unix seconds; NULL = never probed
  response_time INTEGER
);

CREATE TABLE reachability_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  checked_at INTEGER NOT NULL,
  is_online INTEGER NOT NULL,
  response_time INTEGER,
  error TEXT
);
CREATE INDEX idx_reachability_checks_service_time ON reachability_checks(service_id, checked_at);

-- avg_response_time is the mean over UP checks only: a failed probe has no
-- response time to average, and a status page reports the latency of the
-- checks that actually answered.
CREATE TABLE reachability_daily (
  service_id TEXT NOT NULL,
  day TEXT NOT NULL, -- YYYY-MM-DD, UTC
  checks INTEGER NOT NULL DEFAULT 0,
  up_checks INTEGER NOT NULL DEFAULT 0,
  avg_response_time REAL,
  PRIMARY KEY (service_id, day)
);
CREATE INDEX idx_reachability_daily_day ON reachability_daily(day DESC);
