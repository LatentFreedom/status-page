# Uptime feed contract

The frontend renders whatever `GET ${apiBase}/uptime` returns, and the bundled
worker is just one implementation of it. Any endpoint that serves this shape
can drive the page (see "Remote-feed mode" in the README).

## Response

`200 OK`, `Content-Type: application/json`:

```json
{
  "generated_at": "2026-08-31T12:00:00.000Z",
  "window_days": 90,
  "overall": "operational",
  "services": [
    {
      "id": "website",
      "name": "Website",
      "url": "https://example.com",
      "current": "up",
      "last_check": 1756641600,
      "reason": null,
      "uptime_pct": 99.98,
      "days": [
        { "day": "2026-06-03", "checks": 72, "up_checks": 72, "pct": 100 }
      ]
    }
  ]
}
```

## Field semantics

Top level:

- `generated_at` - ISO 8601 timestamp of when the feed was built.
- `window_days` - length of the history window; the page renders exactly 90 bars and left-pads shorter histories with grey.
- `overall` - `"operational" | "partial_outage" | "major_outage" | "unknown"`.
  The reference implementation uses: `unknown` when no service has ever been checked; `major_outage` when `down * 2 >= total`; `partial_outage` when any service is down; `operational` otherwise.

Per service:

- `id` - opaque, unique per service; the page only uses it as a render key. String or number.
- `name` - display name.
- `url` - the monitored URL; rendered as a link.
- `current` - `"up" | "down" | "unknown"`. `unknown` means never checked, not "down".
- `last_check` - unix seconds of the latest probe, or `null` if never checked.
- `reason` - terse cause of the current down state (the reference implementation emits `"HTTP <status>"`, `"Timed out"`, or `"Unreachable"`); `null` while up or unknown. OPTIONAL: consumers must treat a missing field as `null`.
- `uptime_pct` - percentage over the whole window (0-100, two decimals), or `null` with zero checks.
- `days` - per-UTC-day buckets, **oldest first**, at most `window_days` entries.
  - `day` - `YYYY-MM-DD` (UTC).
  - `checks` / `up_checks` - probe counts for that day.
  - `pct` - `up_checks / checks * 100` (two decimals), or **`null` when `checks` is 0**. A day nobody probed is unknown (grey), never a 0% outage.

## Headers

- `Cache-Control: public, max-age=60` - the page polls every 60 seconds to match.
- `Access-Control-Allow-Origin: *` - the page is usually served from a different origin than the feed.

## Errors

Any non-200 response makes the page show a "Status feed unavailable" notice
while keeping the last successful data on screen.
