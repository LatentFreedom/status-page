import UptimeBars from "@/components/UptimeBars";
import { checkedAgo, formatPct, WINDOW_DAYS, type Service } from "@/lib/uptime";

const STATE_LABEL: Record<Service["current"], string> = {
  up: "Operational",
  down: "Down",
  unknown: "No data",
};

const STATE_DOT: Record<Service["current"], string> = {
  up: "bg-ok",
  down: "bg-down",
  unknown: "bg-nodata",
};

export default function ServiceRow({ service }: { service: Service }) {
  const ago = checkedAgo(service.last_check);
  return (
    <li className="border-b border-border py-4 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <span
            className={`size-2 shrink-0 translate-y-px rounded-full ${STATE_DOT[service.current]}`}
            aria-hidden="true"
          />
          <a
            href={service.url}
            target="_blank"
            rel="noreferrer"
            className="truncate font-medium text-foreground hover:underline"
          >
            {service.name}
          </a>
          {service.current === "down" && service.reason && (
            <span className="shrink-0 text-xs font-medium text-down-strong">
              {service.reason}
            </span>
          )}
          <span className="sr-only">{STATE_LABEL[service.current]}</span>
        </div>
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {formatPct(service.uptime_pct)}
        </span>
      </div>

      <div className="mt-2">
        <UptimeBars days={service.days} />
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
        <span>{WINDOW_DAYS} days ago</span>
        <span className="hidden sm:inline">{STATE_LABEL[service.current]}</span>
        <span className="truncate text-right">{ago ?? "Never checked"}</span>
      </div>
    </li>
  );
}
