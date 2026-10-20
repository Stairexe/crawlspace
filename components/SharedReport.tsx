"use client";

import Link from "next/link";
import type { AuditReport } from "@/lib/types";
import { VisibilityDashboard } from "./VisibilityDashboard";
import { CrawlspaceLogo } from "./CrawlspaceLogo";

/** A read-only report behind a share link. No rewrite layer, no reset. */
export function SharedReport({ report, sharedAt }: { report: AuditReport; sharedAt: string }) {
  return (
    <div className="min-h-screen bg-void">
      <header className="border-b border-line bg-void/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1112px] items-center justify-between px-5">
          <Link href="/" aria-label="Crawlspace home" className="rounded-md p-1">
            <CrawlspaceLogo />
          </Link>
          <Link href="/" className="btn-primary">
            Audit your own page
          </Link>
        </div>
      </header>
      <div className="frame border-b border-line px-4 py-8 sm:px-8">
        <p className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-[13.5px] text-ink-dim">
          <span className="bracket">[ shared report ]</span>
          Read-only. Audited <time dateTime={sharedAt}>{new Date(sharedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</time>.
          The page may have changed since.
        </p>
        <VisibilityDashboard report={report} ai={{ enabled: false, providers: [], userKey: "", provider: "anthropic" }} />
      </div>
    </div>
  );
}
