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

describe("buildMetadata", () => {
  it("never sets icons, so the app/ icon files drive the icon tags", () => {
    // Any icons key, even empty, hides the Next.js app/icon.* file conventions.
    expect("icons" in buildMetadata(base)).toBe(false);
  });
});
