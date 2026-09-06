"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CrawlspaceLogo } from "@/components/CrawlspaceLogo";
import { SAMPLE_REPORT } from "@/lib/mockReport";
import { ExportModal } from "@/components/ExportModal";
import { IssuesCenter } from "@/components/IssuesCenter";
import { CrawlerCenter } from "@/components/CrawlerCenter";
import { SchemaAnalyzer } from "@/components/SchemaAnalyzer";

export default function PublicReportPage() {
  const params = useParams();
  const shareId = params?.shareId as string;
  const [exportOpen, setExportOpen] = useState(false);

  const report = SAMPLE_REPORT;
  const v = report.visibility;
  const e = report.evidence;

  return (
    <div className="min-h-screen bg-void text-ink pb-20">
      {/* Client Report Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-void/85 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:opacity-90">
            <CrawlspaceLogo size={28} />
          </Link>
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint border-l border-line pl-3">
            Client Deliverable
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="mono flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 text-[12.5px] font-bold text-void hover:brightness-110 shadow-[0_0_15px_var(--color-signal-glow)]"
          >
            <span>Export Report ↗</span>
          </button>
        </div>
      </header>

      {/* Main Content (No Sidebar - Clean Editorial View) */}
      <main className="mx-auto max-w-5xl px-6 pt-10 space-y-8">
        {/* Banner */}
        <div className="card glass-panel-glow p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="mono text-[11px] uppercase tracking-wider text-signal font-semibold">
                Website Visibility Intelligence Report
              </div>
              <h1 className="text-[28px] font-bold text-ink sm:text-[34px] mt-1">
                {e.html.title || "stripe.com/docs/payments"}
              </h1>
              <div className="mono mt-1 text-[13px] text-ink-dim">
                Target URL: {e.finalUrl} • Generated September 6, 2026
              </div>
            </div>

            {/* Big Score */}
            <div className="flex flex-col items-center sm:items-end">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-signal/40 bg-signal/15 text-[34px] font-bold text-signal mono shadow-[0_0_24px_var(--color-signal-glow)]">
                {v.overall}
              </div>
              <span className="mono text-[11px] uppercase tracking-wider text-ink-faint mt-1.5">
                Visibility Score / 100
              </span>
            </div>
          </div>

          {/* Subscores Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 border-t border-line/70 pt-6">
            <div className="rounded-xl border border-line bg-surface/50 p-3.5">
              <div className="mono text-[10.5px] text-ink-faint uppercase">SEO</div>
              <div className="mono text-[22px] font-bold text-ink mt-1">{v.seo}</div>
              <div className="text-[11px] text-signal">Indexable</div>
            </div>
            <div className="rounded-xl border border-line bg-surface/50 p-3.5">
              <div className="mono text-[10.5px] text-ink-faint uppercase">GEO</div>
              <div className="mono text-[22px] font-bold text-signal mt-1">{v.geo}</div>
              <div className="text-[11px] text-ink-dim">5-Engine Spread</div>
            </div>
            <div className="rounded-xl border border-line bg-surface/50 p-3.5">
              <div className="mono text-[10.5px] text-ink-faint uppercase">Technical</div>
              <div className="mono text-[22px] font-bold text-ink mt-1">{v.technical}</div>
              <div className="text-[11px] text-ink-dim">SSR Validated</div>
            </div>
            <div className="rounded-xl border border-line bg-surface/50 p-3.5">
              <div className="mono text-[10.5px] text-ink-faint uppercase">Content</div>
              <div className="mono text-[22px] font-bold text-ink mt-1">{v.content}</div>
              <div className="text-[11px] text-ink-dim">1.4k words</div>
            </div>
            <div className="rounded-xl border border-line bg-surface/50 p-3.5">
              <div className="mono text-[10.5px] text-ink-faint uppercase">Schema</div>
              <div className="mono text-[22px] font-bold text-ink mt-1">{v.schema}</div>
              <div className="text-[11px] text-signal">3 Types</div>
            </div>
            <div className="rounded-xl border border-line bg-surface/50 p-3.5">
              <div className="mono text-[10.5px] text-ink-faint uppercase">AI Crawlers</div>
              <div className="mono text-[22px] font-bold text-signal mt-1">{v.crawlers}</div>
              <div className="text-[11px] text-signal">Search Allowed</div>
            </div>
          </div>
        </div>

        {/* Priority Issues & Action Plan */}
        <div className="space-y-4">
          <h2 className="text-[20px] font-bold text-ink">Priority Action Items</h2>
          <IssuesCenter findings={report.findings} />
        </div>

        {/* AI Crawler Permissions */}
        <div className="space-y-4">
          <h2 className="text-[20px] font-bold text-ink">AI Crawler Directives</h2>
          <CrawlerCenter evidence={e} />
        </div>

        {/* Structured Data Verification */}
        <div className="space-y-4">
          <h2 className="text-[20px] font-bold text-ink">Structured Data Validation</h2>
          <SchemaAnalyzer evidence={e} />
        </div>

        {/* Client Footer */}
        <div className="rounded-2xl border border-line bg-surface/40 p-6 text-center text-[12.5px] text-ink-dim space-y-2">
          <p>
            Audit delivered by Crawlspace Website Visibility Intelligence • Report ID: {shareId}
          </p>
          <div className="mono text-[11px] text-ink-faint">
            Verified across ChatGPT, Claude, Perplexity, Copilot, and Google AI Overviews.
          </div>
        </div>
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        report={report}
      />
    </div>
  );
}
