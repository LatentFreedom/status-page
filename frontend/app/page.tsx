"use client";

import { useEffect, useRef, useState } from "react";
import ServiceRow from "@/components/ServiceRow";
import StatusBanner from "@/components/StatusBanner";
import {
  fetchUptime,
  REFRESH_MS,
  sortServices,
  type UptimeFeed,
} from "@/lib/uptime";
import config from "../../status.config";

export default function Home() {
  // `feed` is the last good render and is never cleared on a failed refresh:
  // a stale-but-true page beats a blank one when the feed blips.
  const [feed, setFeed] = useState<UptimeFeed | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();

    async function load() {
      try {
        const next = await fetchUptime(controller.signal);
        if (!mounted.current) return;
        setFeed(next);
        setStale(false);
      } catch (err) {
        // An aborted fetch is our own unmount, not a feed fault.
        if (controller.signal.aborted) return;
        if (!mounted.current) return;
        // Swallowed on purpose: the banner below IS the error report, and a
        // console error here would fail the page's own acceptance check.
        setStale(true);
      } finally {
        if (mounted.current) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      mounted.current = false;
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  const services = feed ? sortServices(feed.services) : [];

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6 flex items-center gap-3">
        {config.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.logo} alt="" width={40} height={40} />
        )}
        <h1 className="text-3xl font-bold text-foreground">{config.title}</h1>
      </header>

      {stale && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn-strong"
        >
          Status feed unavailable{feed ? " - showing the last successful update." : "."}
        </p>
      )}

      {feed ? (
        <>
          <StatusBanner feed={feed} />
          {services.length > 0 ? (
            <ul className="mt-6">
              {services.map((service) => (
                <ServiceRow key={service.id} service={service} />
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">No services yet.</p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading status..." : "No status to show yet."}
        </p>
      )}
    </section>
  );
}
