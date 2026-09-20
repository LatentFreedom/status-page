import type { MetadataRoute } from "next";
import { buildRobots } from "@/lib/seo";
import config from "../../status.config";

// Emitted as /robots.txt at build time by the static export.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(config);
}
