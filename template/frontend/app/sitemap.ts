import type { MetadataRoute } from "next";
import { buildSitemap } from "@latentfreedom/status-page/next";
import config from "../../status.config";

// Emitted as /sitemap.xml at build time by the static export.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(config);
}
