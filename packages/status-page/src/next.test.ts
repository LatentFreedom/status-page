import { describe, expect, it } from "vitest";
import type { StatusConfig } from "./config.js";
import { buildMetadata } from "./next.js";

const base: StatusConfig = {
  title: "Example Status",
  description: "Uptime.",
  siteUrl: "https://status.example.com",
  indexable: true,
  logo: null,
  apiBase: "https://example.com/api/v1",
};

describe("buildMetadata icons", () => {
  it("omits the icons key when config.icons is unset", () => {
    // Any icons key, even empty, hides Next.js app/icon.* file conventions.
    expect("icons" in buildMetadata(base)).toBe(false);
  });

  it("maps config.icons to icon and apple tags when set", () => {
    const meta = buildMetadata({
      ...base,
      icons: { favicon: "/favicon.ico", icon512: "/icon-512.png", appleTouch: "/apple.png" },
    });
    expect(meta.icons).toEqual({
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple.png", sizes: "180x180", type: "image/png" }],
    });
  });
});
