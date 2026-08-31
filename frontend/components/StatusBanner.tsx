import { bannerText, type UptimeFeed } from "@/lib/uptime";

const TONE: Record<UptimeFeed["overall"], string> = {
  operational: "border-ok/30 bg-ok/10 text-ok-strong",
  partial_outage: "border-warn/30 bg-warn/10 text-warn-strong",
  major_outage: "border-down/30 bg-down/10 text-down-strong",
  unknown: "border-border bg-muted text-muted-foreground",
};

const DOT: Record<UptimeFeed["overall"], string> = {
  operational: "bg-ok",
  partial_outage: "bg-warn",
  major_outage: "bg-down",
  unknown: "bg-nodata",
};

export default function StatusBanner({ feed }: { feed: UptimeFeed }) {
  const generated = new Date(feed.generated_at);
  const stamp = Number.isNaN(generated.valueOf())
    ? null
    : generated.toLocaleString();
  return (
    <section className={`rounded-lg border p-5 ${TONE[feed.overall]}`}>
      <div className="flex items-center gap-3">
        <span className={`size-3 shrink-0 rounded-full ${DOT[feed.overall]}`} aria-hidden="true" />
        <h2 className="text-lg font-semibold">{bannerText(feed)}</h2>
      </div>
      {stamp && (
        <p className="mt-1 text-sm opacity-80">Updated {stamp}</p>
      )}
    </section>
  );
}
