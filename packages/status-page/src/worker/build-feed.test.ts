import { describe, expect, it } from "vitest";
import { buildFeed, feedWindow, overallOf, pctOf, reasonFromError, WINDOW_DAYS } from "./build-feed.js";

const NOW = Date.UTC(2026, 8, 20, 12) / 1000;

describe("reasonFromError", () => {
  it("passes terse reasons through and collapses raw errors to three shapes", () => {
    expect(reasonFromError(null)).toBeNull();
    expect(reasonFromError("")).toBeNull();
    expect(reasonFromError("HTTP 503")).toBe("HTTP 503");
    expect(reasonFromError("Timed out")).toBe("Timed out");
    expect(reasonFromError("AbortError: The operation was aborted")).toBe("Timed out");
    expect(reasonFromError("TypeError: fetch failed: getaddrinfo ENOTFOUND internal.host")).toBe("Unreachable");
  });
});

describe("overallOf", () => {
  it("says unknown before any probe and major at half the fleet down", () => {
    expect(overallOf(0, 0, 3)).toBe("unknown");
    expect(overallOf(3, 0, 3)).toBe("operational");
    expect(overallOf(3, 1, 3)).toBe("partial_outage");
    expect(overallOf(4, 2, 4)).toBe("major_outage");
  });
});

describe("buildFeed", () => {
  it("emits the contract shape with a full oldest-first window", () => {
    const today = feedWindow(NOW).at(-1)!;
    const feed = buildFeed(
      [
        { id: "a", name: "A", url: "https://a", is_online: 1, last_check: NOW - 60 },
        { id: 7, name: "B", url: "https://b", is_online: 0, last_check: NOW - 60, error: "HTTP 502" },
        { id: "c", name: "C", url: "https://c", is_online: null, last_check: null },
        // Stale error on an up row must not leak as a reason.
        { id: "d", name: "D", url: "https://d", is_online: 1, last_check: NOW, error: "HTTP 500" },
      ],
      [{ service_id: "a", day: today, checks: 3, up_checks: 2 }],
      NOW,
    );
    expect(feed.window_days).toBe(WINDOW_DAYS);
    expect(feed.generated_at).toBe("2026-09-20T12:00:00.000Z");
    expect(feed.overall).toBe("partial_outage");
    const [a, b, c, d] = feed.services;
    expect(a.days).toHaveLength(WINDOW_DAYS);
    expect(a.days[0].day < a.days.at(-1)!.day).toBe(true);
    expect(a.days.at(-1)).toEqual({ day: today, checks: 3, up_checks: 2, pct: 66.67 });
    expect(a.days[0].pct).toBeNull();
    expect(a.uptime_pct).toBe(66.67);
    expect(a.reason).toBeNull();
    expect(b).toMatchObject({ id: 7, current: "down", reason: "HTTP 502", uptime_pct: null });
    expect(c).toMatchObject({ current: "unknown", reason: null, last_check: null });
    expect(d).toMatchObject({ current: "up", reason: null });
  });

  it("rounds to two decimals and never turns an empty day into 0%", () => {
    expect(pctOf(2, 3)).toBe(66.67);
    expect(pctOf(0, 0)).toBeNull();
    expect(pctOf(0, 4)).toBe(0);
  });
});
