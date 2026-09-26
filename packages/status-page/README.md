# @latentfreedom/status-page

A self-hosted status page on Cloudflare: a React page, Next.js metadata helpers, and a probe Worker with D1.
One `status.config.ts` drives all of it.
Start from the instance shell and the full guide at <https://github.com/LatentFreedom/status-page>.

```bash
npx degit LatentFreedom/status-page/template my-status
```

## Entry points

| Import | Exports |
|---|---|
| `@latentfreedom/status-page` | `StatusConfig`, `ServiceConfig`, `IconsConfig`, `defineConfig`, the feed types (`UptimeFeed`, `Service`, `DayBucket`, `Overall`), and the pure helpers (`fetchUptime`, `barTone`, `padDays`, `sortServices`, `bannerText`, ...) |
| `@latentfreedom/status-page/react` | `StatusLayout`, `StatusPage`, `ServiceRow`, `StatusBanner`, `UptimeBars`, `ThemeProvider`, `useTheme`, `ThemeToggle` |
| `@latentfreedom/status-page/next` | `buildMetadata(config)`, `buildSitemap(config)`, `buildRobots(config)` |
| `@latentfreedom/status-page/worker` | `createStatusWorker(config)` - returns `{ fetch, scheduled }`; needs a D1 binding named `DB` |
| `@latentfreedom/status-page/styles.css` | The compiled stylesheet. No Tailwind setup is needed in your app. |

`react`, `react-dom`, and `next` are optional peer dependencies, so a worker that imports only `./worker` installs none of them.

## Frontend only

Any endpoint that serves the JSON shape in [CONTRACT.md](CONTRACT.md) can feed the page.
Set `apiBase` to it, omit `services`, and skip the worker and D1.

## Migrations

The D1 schema ships in `migrations/`.
Point `migrations_dir` in `wrangler.jsonc` at `node_modules/@latentfreedom/status-page/migrations` and run `wrangler d1 migrations apply` after each upgrade.
Migration file names never change, so an existing database stays valid.

## License

MIT
