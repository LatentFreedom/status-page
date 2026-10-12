import type { FeedNotice } from "../uptime.js";

// A feed-level message, such as a hosting-provider incident, shown above the
// overall banner so visitors see the cause before the red rows. The feed
// producer writes the text; the page only renders it.
export function NoticeBanner({ notice }: { notice: FeedNotice }) {
  return (
    <p
      role="status"
      className="mb-4 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn-strong"
    >
      {notice.message}
      {notice.url && (
        <>
          {" "}
          <a
            href={notice.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            Details
          </a>
        </>
      )}
    </p>
  );
}
