import type { Metadata, MetadataRoute } from "next";
import type { StatusConfig } from "./config.js";

// Everything here is derived from status.config.ts so an instance never
// edits app/ files to rebrand: the app shell stays identical across sites.

export function buildMetadata(config: StatusConfig): Metadata {
  const icons = config.icons ?? {};
  const iconList = [
    icons.favicon ? { url: icons.favicon, sizes: "any" } : null,
    icons.icon192
      ? { url: icons.icon192, sizes: "192x192", type: "image/png" }
      : null,
    icons.icon512
      ? { url: icons.icon512, sizes: "512x512", type: "image/png" }
      : null,
  ].filter((icon) => icon !== null);
  const ogImage = config.ogImage ?? null;

  return {
    metadataBase: new URL(config.siteUrl),
    title: config.title,
    description: config.description,
    alternates: { canonical: "/" },
    icons: {
      icon: iconList,
      apple: icons.appleTouch
        ? [{ url: icons.appleTouch, sizes: "180x180", type: "image/png" }]
        : [],
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: config.siteUrl,
      siteName: config.title,
      type: "website",
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: config.title }]
        : [],
    },
    twitter: {
      // A large card with no image renders as a broken preview.
      card: ogImage ? "summary_large_image" : "summary",
      title: config.title,
      description: config.description,
      images: ogImage ? [ogImage] : [],
    },
    // robots.txt only blocks crawling; this blocks indexing of any URL that
    // leaks out anyway. Both hang off `indexable` so they cannot disagree.
    robots: config.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
  };
}

export function buildSitemap(config: StatusConfig): MetadataRoute.Sitemap {
  // Single-page site: the banner and the service list all live on "/".
  return [{ url: config.siteUrl, changeFrequency: "daily", priority: 1 }];
}

export function buildRobots(config: StatusConfig): MetadataRoute.Robots {
  if (!config.indexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
