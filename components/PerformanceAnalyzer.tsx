"use client";

import type { Evidence } from "@/lib/types";

/**
 * Only what the survey measured. Crawlspace fetches HTML with a server-side client; it
 * does not run a browser, so it cannot observe Core Web Vitals. An earlier version of
 * this panel showed fixed LCP/INP/CLS/FCP values and invented DNS/TLS splits for every
 * page — those are gone. For real vitals, the panel links out to PageSpeed Insights.
 */

function band(ms: number): { label: string; tone: string } {
  if (ms <= 800) return { label: "Fast", tone: "text-good" };
  if (ms <= 1800) return { label: "Slow for a crawler", tone: "text-warn" };
  return { label: "Risk of crawler timeout", tone: "text-danger" };
}

export function PerformanceAnalyzer({ evidence }: { evidence: Evidence }) {
  const { totalMs, fetchMs } = evidence.timings;
  const kb = (evidence.html.htmlBytes / 1024).toFixed(1);
  const ratio = evidence.html.textToHtmlRatio;
  const speed = band(fetchMs);
  const psi = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(evidence.finalUrl)}`;

  const rows: [string, string, string?][] = [
    ["Page fetch", `${fetchMs} ms`, speed.label],
    ["Whole survey, incl. robots.txt, llms.txt, sitemap", `${totalMs} ms`],
    ["HTML as served", `${kb} KB`],
    ["Words of visible text", String(evidence.html.textWords)],
    ["Text-to-HTML ratio", ratio.toFixed(3), ratio < 0.1 ? "Mostly markup and scripts" : "Healthy"],
    ["HTTP status", String(evidence.status)],
  ];

  return (
    <div className="space-y-6 rise">
      <div className="card p-6 space-y-5">
        <div>
          <div className="tb-label">Retrieval</div>
          <h2 className="mt-1 text-[20px] font-bold text-ink">How fast a crawler gets this page</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-dim">
            Measured from the survey’s own fetch of{" "}
            <span className="mono text-ink">{evidence.finalUrl}</span>. AI crawlers fetch HTML in much
            the same way, so a slow or heavy response costs retrieval before any content is read.
          </p>
        </div>

        <dl className="divide-y divide-line border-y border-line">
          {rows.map(([k, v, note]) => (
            <div key={k} className="grid grid-cols-[1fr_auto] gap-4 py-3 sm:grid-cols-[1fr_auto_200px]">
              <dt className="text-[13.5px] text-ink-dim">{k}</dt>
              <dd className="mono text-[13.5px] font-semibold text-ink">{v}</dd>
              <dd
                className={`mono text-[11.5px] sm:text-right ${
                  k === "Page fetch" ? speed.tone : "text-ink-faint"
                } col-span-2 sm:col-span-1`}
              >
                {note ?? ""}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card p-6">
        <div className="tb-label">Not measured</div>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-dim">
          Core Web Vitals (LCP, INP, CLS) need a real browser rendering the page, and Crawlspace does
          not run one. They matter for Google ranking more than for AI citation. Measure them with{" "}
          <a href={psi} target="_blank" rel="noreferrer" className="underline underline-offset-4 text-ink">
            PageSpeed Insights for this URL
          </a>
          .
        </p>
      </div>
    </div>
  );
}
