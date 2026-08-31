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

export type StatusConfig = {
  /** Page heading and <title>. */
  title: string;
  /** <meta name="description"> content. */
  description: string;
  /** Logo path under frontend/public/ (e.g. "/logo.svg"), or null to hide it. */
  logo: string | null;
  /**
   * Where the frontend fetches `${apiBase}/uptime`. Point it at the
   * bundled worker after `wrangler deploy`, or at any endpoint that
   * implements CONTRACT.md. Overridable at build time with
   * NEXT_PUBLIC_UPTIME_API.
   */
  apiBase: string;
  /** The services to monitor and display, in display order. */
  services: ServiceConfig[];
};
