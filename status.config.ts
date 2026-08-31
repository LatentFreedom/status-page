import type { StatusConfig } from "./config.schema";

const config = {
  title: "Example Status",
  description: "Current state and uptime history of our services.",
  logo: "/logo.svg",

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
