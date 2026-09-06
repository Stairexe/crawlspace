"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CrawlspaceLogo } from "@/components/CrawlspaceLogo";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  "Fetching website & validating HTTP response",
  "Checking robots.txt & parsing crawler rules",
  "Checking sitemap.xml & index declarations",
  "Analyzing pages & semantic heading hierarchy",
  "Checking structured data & Schema.org entities",
  "Analyzing content & evaluating deixis passages",
  "Calculating 5-engine visibility scores",
];

export default function NewAuditPage() {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState("");
  const [crawlScope, setCrawlScope] = useState<"full" | "single">("full");
  const [maxPages, setMaxPages] = useState<number>(50);
  const [isScanning, setIsScanning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  function handleStartAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setIsScanning(true);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            // Redirect to dashboard with the audited domain
            router.push(`/dashboard?domain=${encodeURIComponent(targetUrl.trim())}`);
          }, 800);
          return prev;
        }
      });
    }, 900);
  }

  return (
    <div className="flex min-h-screen flex-col bg-void text-ink">
      {/* Top Header */}
      <header className="flex h-16 items-center justify-between border-b border-line px-6 bg-surface/30">
        <Link href="/" className="hover:opacity-90">
          <CrawlspaceLogo size={28} />
        </Link>
        <Link
          href="/dashboard"
          className="mono text-[12.5px] text-ink-dim hover:text-ink flex items-center gap-1"
        >
          <span>Exit to Dashboard</span>
          <span aria-hidden>→</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {!isScanning ? (
            <div className="card glass-panel-glow p-8 sm:p-10 space-y-7">
              <div className="text-center space-y-2">
                <span className="mono text-[11px] uppercase tracking-wider text-signal font-semibold">
                  New Diagnostic Crawl
                </span>
                <h1 className="text-[28px] font-bold text-ink sm:text-[34px]">
                  Analyze a website
                </h1>
                <p className="text-[14px] text-ink-dim">
                  Audit search engine indexability, AI citability, and crawler directives.
                </p>
              </div>

              <form onSubmit={handleStartAudit} className="space-y-6">
                <div>
                  <label className="mono block text-[11px] uppercase tracking-wider text-ink-faint mb-2 font-medium">
                    Website URL
                  </label>
                  <input
                    type="text"
                    required
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://example.com"
                    autoFocus
                    className="mono h-13 w-full rounded-xl border border-line bg-surface px-4 text-[14.5px] text-ink placeholder:text-ink-faint/60 transition-all focus:border-signal focus:shadow-[0_0_20px_var(--color-signal-glow)]"
                  />
                </div>

                {/* Options: Full website vs Single page */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCrawlScope("full")}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      crawlScope === "full"
                        ? "border-signal bg-signal/10 shadow-[0_0_12px_var(--color-signal-glow)]"
                        : "border-line bg-surface/50 text-ink-dim hover:border-line-bright"
                    }`}
                  >
                    <div className="mono text-[13px] font-bold text-ink">Full website</div>
                    <div className="text-[11.5px] text-ink-faint mt-1">
                      Crawl domain via sitemap & internal links
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCrawlScope("single")}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      crawlScope === "single"
                        ? "border-signal bg-signal/10 shadow-[0_0_12px_var(--color-signal-glow)]"
                        : "border-line bg-surface/50 text-ink-dim hover:border-line-bright"
                    }`}
                  >
                    <div className="mono text-[13px] font-bold text-ink">Single page</div>
                    <div className="text-[11.5px] text-ink-faint mt-1">
                      Fast focused audit of specific URL
                    </div>
                  </button>
                </div>

                {/* Max Pages Option */}
                {crawlScope === "full" && (
                  <div>
                    <label className="mono block text-[11px] uppercase tracking-wider text-ink-faint mb-2 font-medium">
                      Maximum pages to crawl
                    </label>
                    <div className="flex gap-2">
                      {[10, 50, 250].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setMaxPages(count)}
                          className={`mono flex-1 rounded-lg border py-2 text-[12.5px] font-semibold transition-all ${
                            maxPages === count
                              ? "border-signal bg-signal/15 text-signal"
                              : "border-line bg-surface text-ink-dim hover:text-ink"
                          }`}
                        >
                          {count} pages
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="mono h-13 w-full rounded-xl bg-signal text-[14px] font-bold text-void transition-all hover:brightness-110 shadow-[0_0_20px_var(--color-signal-glow)]"
                >
                  Start Audit →
                </button>
              </form>
            </div>
          ) : (
            /* Scanning Screen */
            <div className="card glass-panel-glow p-8 sm:p-10 space-y-6">
              <div className="text-center space-y-2">
                <div className="mono inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-[11.5px] text-signal font-semibold">
                  <span className="h-2 w-2 rounded-full bg-signal pulse-dot" />
                  Analyzing {targetUrl}
                </div>
                <h2 className="text-[22px] font-bold text-ink pt-1">
                  Scanning Website Architecture
                </h2>
              </div>

              {/* Progress Line */}
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full bg-signal transition-all duration-700 ease-out"
                  style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                />
              </div>

              {/* Checklist */}
              <div className="space-y-3 pt-2">
                {STEPS.map((s, idx) => {
                  const isDone = idx < stepIndex;
                  const isCurrent = idx === stepIndex;
                  return (
                    <div
                      key={s}
                      className="mono flex items-center gap-3 text-[13px] transition-colors"
                      style={{
                        color:
                          isDone || isCurrent ? "var(--color-ink)" : "var(--color-ink-faint)",
                      }}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          isDone
                            ? "bg-signal text-void"
                            : isCurrent
                            ? "border border-signal text-signal"
                            : "border border-line text-ink-faint"
                        }`}
                      >
                        {isDone ? (
                          <Check className="h-3 w-3 stroke-[3]" />
                        ) : isCurrent ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <span className="h-1 w-1 rounded-full bg-ink-faint" />
                        )}
                      </span>
                      <span>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
