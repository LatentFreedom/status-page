// Type-only import: this file sits above both apps, so it must not need a
// runtime module of its own. Each app maps the name in its tsconfig `paths`.
import type { StatusConfig } from "@latentfreedom/status-page";

const config = {
  title: "Example Status",
  description: "Current state and uptime history of our services.",
  logo: "/logo.svg",

  // Your production origin, no trailing slash. Used for the canonical URL,
  // share previews, and the sitemap.
  siteUrl: "https://status.example.com",
  // false = noindex meta tag plus a disallow-all robots.txt.
  indexable: true,
  // Optional: a 1200x630 share image and icons, as paths under frontend/public/.
  ogImage: null,
  icons: {},

  // After `wrangler deploy` in worker/, paste your worker URL here
  // (keep the /api/v1 suffix). A custom domain works the same way.
  // Overridable at build time with NEXT_PUBLIC_UPTIME_API.
  apiBase: "https://status-page-probe.YOUR-SUBDOMAIN.workers.dev/api/v1",

  services: [
    { id: "website", name: "Website", url: "https://example.com" },
    { id: "docs", name: "Docs", url: "https://example.org" },
  ],
} satisfies StatusConfig;

export default config;
