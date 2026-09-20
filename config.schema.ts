/**
 * The shape of status.config.ts - the one file you edit to make this
 * status page yours. Both the frontend (at build time) and the worker
 * (at deploy time) import the config, so editing services means
 * redeploying the worker, and editing branding means rebuilding the
 * frontend. When in doubt, redeploy both.
 */

export type ServiceConfig = {
  /**
   * Stable identifier - the key uptime history is stored under in D1.
   * Renaming `name` or `url` keeps a service's history; changing `id`
   * starts it from scratch. Must be unique across services.
   */
  id: string;
  /** Display name shown on the page. */
  name: string;
  /** Probed with a GET request; "https://" is assumed if the scheme is missing. */
  url: string;
};

export type IconsConfig = {
  /** Paths under frontend/public/. Omit any you do not ship. */
  favicon?: string;
  icon192?: string;
  icon512?: string;
  appleTouch?: string;
};

export type StatusConfig = {
  /** Page heading and <title>. */
  title: string;
  /** <meta name="description"> content. */
  description: string;
  /**
   * Canonical production origin, no trailing slash (e.g.
   * "https://status.example.com"). Share previews and the sitemap need
   * absolute URLs, and a static export cannot read the request host.
   */
  siteUrl: string;
  /**
   * The one switch for search engines: false emits a noindex meta tag AND
   * a robots.txt that disallows everything. Keeping both behind one flag
   * prevents a half-launched site where one was opened and the other not.
   */
  indexable: boolean;
  /** 1200x630 share image path under frontend/public/, or null for none. */
  ogImage?: string | null;
  /** Favicon and home-screen icons. Omit to ship none. */
  icons?: IconsConfig;
  /** Logo path under frontend/public/ (e.g. "/logo.svg"), or null to hide it. */
  logo: string | null;
  /**
   * Where the frontend fetches `${apiBase}/uptime`. Point it at the
   * bundled worker after `wrangler deploy`, or at any endpoint that
   * implements CONTRACT.md. Overridable at build time with
   * NEXT_PUBLIC_UPTIME_API.
   */
  apiBase: string;
  /**
   * The services the worker probes, in display order. Omit it for a
   * frontend-only instance whose `apiBase` points at a feed somebody else
   * serves - the page takes its service list from the feed, never from here.
   */
  services?: ServiceConfig[];
};
