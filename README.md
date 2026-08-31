# status-page

A self-hosted status page on Cloudflare: Next.js static frontend, a probe Worker, and a D1 database - configured by one file.

- One overall banner, one row per service, 90 days of uptime bars, auto-refresh every minute.
- Light and dark themes, mobile-friendly (tap or scrub the bars for a day detail card).
- No accounts, no framework lock-in, no runtime dependencies in the worker.

## How it works

`status.config.ts` at the repo root lists your services and branding.
The worker probes each service every 20 minutes (cron) and writes latest state plus per-day rollups to D1.
The frontend is a static export that fetches the worker's public JSON feed (`GET /api/v1/uptime`) and renders it.

```
status.config.ts ──▶ worker (cron probe) ──▶ D1 ──▶ /api/v1/uptime ──▶ static frontend
```

## Quick start

Prerequisites: a Cloudflare account (free plan works) and Node 20+.

1. Click **Use this template** on GitHub, clone your copy.
2. Edit `status.config.ts`: your services, title, description, logo.
3. Create the database and deploy the worker:

```bash
cd worker
npm ci
npx wrangler d1 create status-page-db
# paste the printed database_id into worker/wrangler.jsonc
npx wrangler d1 migrations apply status-page-db --remote
npx wrangler deploy
```

4. Put the deployed worker URL into `status.config.ts` as `apiBase` (keep the `/api/v1` suffix), e.g. `https://status-page-probe.your-subdomain.workers.dev/api/v1`.
5. (Optional) Enable the on-demand probe so you don't wait for the first cron tick:

```bash
npx wrangler secret put PROBE_SECRET
curl -X POST -H "Authorization: Bearer <your secret>" https://<your-worker>/api/v1/probe
```

6. Build and deploy the frontend:

```bash
cd ../frontend
npm ci
npm run build
npx wrangler pages deploy out --project-name my-status-page
```

That's it. Custom domains for both the Pages project and the worker are plain Cloudflare dashboard settings.

## Editing services later

Edit `status.config.ts`, then redeploy the worker (`npx wrangler deploy`) and rebuild/redeploy the frontend.
Both sides bundle the config at build time, so a config change is a redeploy of both.
A new service shows grey ("No data") until its first probe - at most 20 minutes, or immediately via `POST /api/v1/probe`.

`id` is the key history is stored under: renaming `name` or `url` keeps a service's history, changing `id` starts it fresh.
Removing a service just stops probing it; its old rows are ignored and the raw log self-prunes after 100 days.

## Branding

- Title, description, and logo: `status.config.ts` (logo files go in `frontend/public/`; set `logo: null` to hide it).
- Colors: CSS variables in `frontend/app/globals.css` - every surface and status color is a token with a light and a dark value.

## Remote-feed mode

The frontend and worker are decoupled by the feed contract ([CONTRACT.md](CONTRACT.md)).
If you already have an endpoint that serves that JSON shape, point the frontend at it and skip the worker + D1 entirely:
set `apiBase` in the config, or override per build with `NEXT_PUBLIC_UPTIME_API`.

## Local development

```bash
# Terminal 1 - worker with a local D1 and a simulated cron
cd worker
npm ci
npm run migrate:local
npm run dev
# trigger a probe pass:
curl "http://localhost:8787/__scheduled?cron=*/20+*+*+*+*"

# Terminal 2 - frontend against the local worker
cd frontend
npm ci
NEXT_PUBLIC_UPTIME_API=http://localhost:8787/api/v1 npm run dev
```

## Limits and probe semantics

- Each probe is a `GET` with an 8s timeout that does not follow redirects; HTTP 200-399 counts as up, anything else (or a network error) as down.
- Rollups are per UTC day; a day with zero checks renders grey ("no data"), never as 0%.
- The free Workers plan caps subrequests at 50 per invocation, so each cron tick probes at most 40 services, stalest first; larger rosters rotate across ticks.
- The probe sends `User-Agent: status-page-probe/1.0 (+https://github.com/LatentFreedom/status-page)`.

## License

[MIT](LICENSE)
