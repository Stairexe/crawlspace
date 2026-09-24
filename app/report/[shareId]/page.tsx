"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CrawlspaceLogo } from "@/components/CrawlspaceLogo";

/**
 * Shared reports need storage, and Crawlspace has none yet — audits exist only in the
 * tab that produced them. This page previously rendered fabricated findings about
 * Stripe, including invented passage quotes, under the heading "Client Deliverable".
 * That is removed. Until saved surveys are real, this route says so.
 */
export default function PublicReportPage() {
  const params = useParams();
  const shareId = (params?.shareId as string) ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-void text-ink">
      <header className="flex h-16 items-center border-b border-line px-6">
        <Link href="/" className="hover:opacity-90">
          <CrawlspaceLogo size={28} />
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-20">
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          Survey not on file
        </p>
        <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight">
          There is no saved survey at this address.
        </h1>
        <p className="mt-4 text-[14.5px] leading-relaxed text-ink-dim">
          Crawlspace does not store audits yet. A report exists only in the tab that ran
          it, which is why this link has nothing to show
          {shareId ? <> for <span className="mono text-ink-faint">{shareId}</span></> : null}.
          Saved and shareable surveys arrive with accounts.
        </p>
        <p className="mt-4 text-[13.5px] leading-relaxed text-ink-faint">
          If you were sent this link expecting a report, ask whoever ran the audit to
          export it — every survey downloads as Markdown or JSON from the results screen.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="mono rounded-lg bg-signal px-4 py-2 text-[12.5px] font-semibold text-void transition-all hover:brightness-110"
          >
            Run an audit
          </Link>
          <Link
            href="/methodology"
            className="mono rounded-lg border border-line px-4 py-2 text-[12.5px] text-ink-dim transition-colors hover:border-line-bright hover:text-ink"
          >
            Read the methodology
          </Link>
        </div>
      </div>
    </div>
  );
}
