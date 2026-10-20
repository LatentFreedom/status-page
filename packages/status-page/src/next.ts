import type { Metadata, MetadataRoute } from "next";
import type { StatusConfig } from "./config.js";

// Everything here is derived from status.config.ts so an instance never
// edits app/ code to rebrand: the app shell stays identical across sites.
// The one exception is the site icon, which is the app/ icon files.

export function buildMetadata(config: StatusConfig): Metadata {
  const ogImage = config.ogImage ?? null;

  return {
    metadataBase: new URL(config.siteUrl),
    title: config.title,
    description: config.description,
    alternates: { canonical: "/" },
    // No `icons` key: any value, even an empty one, makes Next.js drop the
    // app/icon.svg, app/apple-icon.png, and app/favicon.ico tags, and those
    // files are the one icon source every portfolio site uses.
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
