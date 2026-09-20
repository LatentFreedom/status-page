import { describe, expect, it } from "vitest";
import {
  bannerText,
  barTone,
  checkedAgo,
  formatDay,
  formatPct,
  padDays,
  sortServices,
  WINDOW_DAYS,
  type Service,
  type UptimeFeed,
} from "./uptime.js";

function service(over: Partial<Service>): Service {
  return {
    id: "a",
    name: "A",
    url: "https://a.example",
    current: "up",
    last_check: 1,
    uptime_pct: 100,
    days: [],
    ...over,
  };
}

function feed(overall: UptimeFeed["overall"], services: Service[]): UptimeFeed {
  return { generated_at: "2026-09-01T00:00:00Z", window_days: 90, overall, services };
}

describe("barTone", () => {
  it("treats an unprobed day as no data, never as an outage", () => {
    expect(barTone(null)).toBe("nodata");
  });

  it("uses the 99.5 and 95 thresholds", () => {
    expect(barTone(100)).toBe("ok");
    expect(barTone(99.5)).toBe("ok");
    expect(barTone(99.49)).toBe("warn");
    expect(barTone(95)).toBe("warn");
    expect(barTone(94.99)).toBe("down");
    expect(barTone(0)).toBe("down");
  });
});

describe("padDays", () => {
  it("pads a young service on the left with dated no-data buckets", () => {
    const days = [{ day: "2026-09-02", checks: 3, up_checks: 3, pct: 100 }];
    const padded = padDays(days);
    expect(padded).toHaveLength(WINDOW_DAYS);
    expect(padded.at(-1)).toEqual(days[0]);
    expect(padded.at(-2)).toEqual({ day: "2026-09-01", checks: 0, up_checks: 0, pct: null });
  });

  it("keeps only the newest window when given too many days", () => {
    const days = Array.from({ length: WINDOW_DAYS + 5 }, (_, i) => ({
      day: `d${i}`,
      checks: 1,
      up_checks: 1,
      pct: 100,
    }));
    const padded = padDays(days);
    expect(padded).toHaveLength(WINDOW_DAYS);
    expect(padded[0].day).toBe("d5");
  });

  it("still renders a full strip for a service with no history", () => {
    expect(padDays([])).toHaveLength(WINDOW_DAYS);
  });
});

describe("sortServices", () => {
  it("lists down services first, then alphabetical, without mutating input", () => {
    const input = [
      service({ id: 1, name: "Zed" }),
      service({ id: 2, name: "Beta", current: "down" }),
      service({ id: 3, name: "Alpha", current: "unknown" }),
    ];
    expect(sortServices(input).map((s) => s.name)).toEqual(["Beta", "Alpha", "Zed"]);
    expect(input[0].name).toBe("Zed");
  });
});

describe("bannerText", () => {
  it("reports each overall state", () => {
    const down = service({ current: "down" });
    expect(bannerText(feed("operational", [service({})]))).toBe("All systems operational");
    expect(bannerText(feed("partial_outage", [down, service({}), service({})]))).toBe(
      "Partial outage - 1 of 3 services down",
    );
    expect(bannerText(feed("major_outage", [down]))).toBe("Major outage - 1 of 1 services down");
    expect(bannerText(feed("unknown", []))).toBe("No data yet");
  });
});

describe("formatting", () => {
  it("formats days in UTC and passes placeholder keys through", () => {
    expect(formatDay("2026-08-27")).toBe("Aug 27, 2026");
    expect(formatDay("pad-3")).toBe("pad-3");
  });

  it("formats percentages and the last check age", () => {
    expect(formatPct(null)).toBe("-");
    expect(formatPct(99.5)).toBe("99.50%");
    const now = 10_000_000_000;
    expect(checkedAgo(null, now)).toBeNull();
    expect(checkedAgo(now / 1000 - 30, now)).toBe("Checked just now");
    expect(checkedAgo(now / 1000 - 5 * 60, now)).toBe("Checked 5 min ago");
    expect(checkedAgo(now / 1000 - 3 * 3600, now)).toBe("Checked 3 hr ago");
    expect(checkedAgo(now / 1000 - 24 * 3600, now)).toBe("Checked 1 day ago");
  });
});
