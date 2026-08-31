"use client";

import { useEffect, useRef, useState } from "react";
import { barTone, formatDay, padDays, type DayBucket, type Tone } from "@/lib/uptime";

const TONE_CLASS: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  down: "bg-down",
  nodata: "bg-nodata",
};

const TONE_LABEL: Record<Tone, string> = {
  ok: "Operational",
  warn: "Degraded",
  down: "Outage",
  nodata: "No data",
};

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-ok-strong",
  warn: "text-warn-strong",
  down: "text-down-strong",
  nodata: "text-muted-foreground",
};

// Half the tooltip's w-44 width; the clamp keeps the card inside the strip
// when an edge bar is hovered.
const TOOLTIP_HALF_PX = 88;

/**
 * The 90-day strip, oldest on the left.
 *
 * Bars are `flex-1` over `min-w-0`, so 90 of them divide whatever width exists
 * instead of overflowing it. That is what keeps the page free of horizontal
 * scroll at 375px, where each bar lands near 2px wide.
 *
 * The day card follows the mouse on hover. On touch the selection is sticky:
 * a tap (or a horizontal scrub) picks a day and a tap outside dismisses it,
 * because 2px bars are too small for hover semantics on a phone. The index
 * comes from the pointer's x over the whole strip, not per-bar targets, so a
 * fingertip never has to land on one exact bar. `touch-pan-y` keeps vertical
 * page scrolling alive over the strip.
 *
 * The strip stays aria-hidden: the card repeats data already exposed in the
 * row's text, so screen readers lose nothing.
 */
export default function UptimeBars({ days }: { days: DayBucket[] }) {
  const padded = padDays(days);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [sticky, setSticky] = useState(false);

  const indexFromX = (clientX: number): number | null => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const i = Math.floor(((clientX - rect.left) / rect.width) * padded.length);
    return Math.min(padded.length - 1, Math.max(0, i));
  };

  // A sticky (touch) selection dismisses on the next tap outside this row.
  // Scoped to `sticky` so mouse users never pay for a document listener.
  useEffect(() => {
    if (!sticky) return;
    const onDocPointerDown = (e: PointerEvent) => {
      if (e.target instanceof Node && rootRef.current?.contains(e.target)) return;
      setActive(null);
      setSticky(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [sticky]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    const i = indexFromX(e.clientX);
    if (i === null) return;
    setActive(i);
    setSticky(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Mouse hovers freely; touch only scrubs after it has already selected.
    if (e.pointerType === "mouse" ? sticky : !sticky) return;
    const i = indexFromX(e.clientX);
    if (i !== null) setActive(i);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && !sticky) setActive(null);
  };

  const activeDay = active === null ? null : padded[active];
  const tone = activeDay ? barTone(activeDay.pct) : null;
  const leftPct = active === null ? 0 : ((active + 0.5) / padded.length) * 100;

  return (
    <div ref={rootRef} className="relative">
      <div
        ref={stripRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="flex h-8 w-full touch-pan-y items-stretch gap-px"
        aria-hidden="true"
      >
        {padded.map((d, i) => (
          <div
            key={d.day}
            className={`min-w-0 flex-1 rounded-[1px] transition-opacity ${TONE_CLASS[barTone(d.pct)]} ${
              active === null || active === i ? "" : "opacity-40"
            }`}
          />
        ))}
      </div>

      {activeDay && tone && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full z-20 mb-2 w-44 -translate-x-1/2 rounded-lg border border-border bg-card p-3 text-xs shadow-lg"
          style={{
            left: `clamp(${TOOLTIP_HALF_PX}px, ${leftPct}%, calc(100% - ${TOOLTIP_HALF_PX}px))`,
          }}
        >
          <p className="font-medium text-card-foreground">{formatDay(activeDay.day)}</p>
          <p className={`mt-0.5 font-semibold ${TONE_TEXT[tone]}`}>{TONE_LABEL[tone]}</p>
          {activeDay.pct === null ? (
            <p className="mt-1 text-muted-foreground">No checks recorded.</p>
          ) : (
            <dl className="mt-1 space-y-0.5 text-muted-foreground">
              <div className="flex justify-between">
                <dt>Uptime</dt>
                <dd className="tabular-nums text-card-foreground">{activeDay.pct.toFixed(2)}%</dd>
              </div>
              <div className="flex justify-between">
                <dt>Checks</dt>
                <dd className="tabular-nums text-card-foreground">{activeDay.checks}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Failed</dt>
                <dd className="tabular-nums text-card-foreground">
                  {activeDay.checks - activeDay.up_checks}
                </dd>
              </div>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
