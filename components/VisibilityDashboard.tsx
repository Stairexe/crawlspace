"use client";

import { useState } from "react";
import { FixPlan } from "./FixPlan";
import { PrintButton } from "./PrintReport";
import { CrawlerView } from "./CrawlerView";
import type { AuditReport } from "@/lib/types";
import { ENGINES, ENGINE_LABELS } from "@/lib/types";
import { scoreColor, scoreLabel, useCountUp } from "./primitives";
import { CrawlerCenter } from "./CrawlerCenter";
import { SchemaAnalyzer } from "./SchemaAnalyzer";
import { RobotsAnalyzer } from "./RobotsAnalyzer";
import { DefectSchedule } from "./DefectSchedule";
import { WeakBlocks, type AiState } from "./Blocks";
import { Generated } from "./Generated";
import { ExportModal } from "./ExportModal";

type Tab =
  | "overview"
  | "seo"
  | "geo"
  | "crawlers"
  | "content"
  | "schema"
  | "robots"
  | "view"
  | "issues";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Summary" },
  { id: "issues", label: "Defect schedule" },
  { id: "geo", label: "Passages" },
  { id: "view", label: "Crawler's view" },
  { id: "crawlers", label: "Crawlers" },
  { id: "robots", label: "Robots.txt" },
  { id: "schema", label: "Structured data" },
  { id: "content", label: "Content" },
  { id: "seo", label: "Search basics" },
];

/** One engine's score as a cell of the sheet's title block. A capped engine is stamped. */
function EngineCell({ label, score, capped, capReason }: { label: string; score: number; capped: boolean; capReason?: string }) {
  const n = useCountUp(score);
  return (
    <div className="min-w-0 px-3 py-3 sm:px-4" title={capped ? capReason : scoreLabel(score)}>
      <div className="tb-label truncate">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="num text-[26px] leading-none" style={{ color: scoreColor(score) }}>
          {n}
        </span>
        {capped && (
          <span className="mono border border-danger px-1 text-[9px] uppercase tracking-[0.08em] text-danger">Capped</span>
        )}
      </div>
      <div className="mt-2 h-[3px] bg-line" aria-hidden>
        <div className="h-full transition-[width] duration-700" style={{ width: `${score}%`, background: scoreColor(score) }} />
      </div>
    </div>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "bad" | "neutral" }) {
  const color = { good: "text-good", warn: "text-warn", bad: "text-danger", neutral: "text-ink-dim" }[tone];
  return (
    <div className="min-w-0 px-4 py-3">
      <div className="tb-label">{label}</div>
      <div className={`mono mt-1 truncate text-[12.5px] ${color}`}>{value}</div>
    </div>
  );
}

export function VisibilityDashboard({
  report,
  ai,
  onReset,
}: {
  report: AuditReport;
  ai: AiState;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [exportOpen, setExportOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  const e = report.evidence;
  const vis = report.visibility;
  const host = (() => {
    try {
      return new URL(e.finalUrl).hostname;
    } catch {
      return e.finalUrl;
    }
  })();
  const surveyed = new Date(e.fetchedAt);
  const capped = ENGINES.filter((en) => report.engines[en].capped);
  const entity = e.entity;

  function go(t: Tab) {
    setTab(t);
    requestAnimationFrame(() => document.getElementById("sheet-tabs")?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }

  return (
    <div className="space-y-8 rise">
      {/* ── The sheet's title block ── */}
      <section className="plate" aria-labelledby="sheet-title">
        <div className="mono flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-5 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
          <span>Survey sheet — AI citability</span>
          <span>
            Surveyed <time dateTime={e.fetchedAt}>{surveyed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
          </span>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="tb-label">Subject</div>
            <h2 id="sheet-title" className="mt-1 text-[clamp(22px,3vw,30px)] leading-[1.1] [overflow-wrap:anywhere]">
              {e.html.title || host}
            </h2>
            <div className="mono mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-dim">
              <a href={e.finalUrl} target="_blank" rel="noreferrer" className="underline decoration-line-bright underline-offset-4 [overflow-wrap:anywhere] hover:text-signal">
                {e.finalUrl}
              </a>
              <span aria-hidden>·</span>
              <span>HTTP {e.status}</span>
              <span aria-hidden>·</span>
              <span>{e.timings.fetchMs} ms</span>
              <span aria-hidden>·</span>
              <span>{e.html.textWords.toLocaleString()} words</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setExportOpen(true)} className="btn-primary">
              Export
            </button>
            <button type="button" onClick={() => setGenerateOpen(true)} className="btn-quiet">
              Generate files
            </button>
            <PrintButton report={report} className="btn-quiet" />
            <a href="/compare" className="btn-quiet">
              Compare
            </a>
            <button type="button" onClick={onReset} className="btn-quiet">
              New survey
            </button>
          </div>
        </div>

        {/* Composite + five engines */}
        <div className="grid grid-cols-2 border-t border-signal sm:grid-cols-3 lg:grid-cols-6 [&>*]:border-b [&>*]:border-r [&>*]:border-line">
          <div className="min-w-0 bg-wash/40 px-3 py-3 sm:px-4">
            <div className="tb-label">Composite</div>
            <div className="num mt-1 text-[26px] leading-none" style={{ color: scoreColor(report.composite) }}>
              {report.composite}
            </div>
            <div className="mono mt-2 text-[10.5px] text-ink-faint">spread {report.spread} pts</div>
          </div>
          {ENGINES.map((en) => (
            <EngineCell
              key={en}
              label={ENGINE_LABELS[en].replace("Google ", "")}
              score={report.engines[en].score}
              capped={report.engines[en].capped}
              capReason={report.engines[en].capReason}
            />
          ))}
        </div>

        {capped.length > 0 && (
          <div className="flex items-start gap-3 border-b border-line bg-tint-bad px-5 py-3 text-[13px] text-ink">
            <span className="callout shrink-0" data-n="!" aria-hidden />
            <span>
              <strong className="text-danger">Gate failed.</strong>{" "}
              {report.engines[capped[0]].capReason ?? "An engine cannot fetch this page."}{" "}
              {capped.length > 1 && `${capped.length} engines are capped at 25 until it is fixed.`}
            </span>
          </div>
        )}

        {/* Record of the site files, read alongside the page */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 [&>*]:border-r [&>*]:border-line">
          <Fact label="robots.txt" value={e.robots.found ? "Served" : "None"} tone={e.robots.found ? "good" : "warn"} />
          <Fact label="llms.txt" value={e.llmsTxt.found ? (e.llmsTxt.valid ? "Valid" : "Has issues") : "None"} tone={e.llmsTxt.found ? (e.llmsTxt.valid ? "good" : "warn") : "neutral"} />
          <Fact label="sitemap.xml" value={e.sitemap.found ? `Found${e.sitemap.urlCount ? ` · ${e.sitemap.urlCount} URLs` : ""}` : "None"} tone={e.sitemap.found ? "good" : "warn"} />
          <Fact label="Without JavaScript" value={e.renderedWithoutJs ? "Content present" : "Empty shell"} tone={e.renderedWithoutJs ? "good" : "bad"} />
          <Fact
            label="Knowledge graph"
            value={
              !entity || entity.platform || !entity.checked
                ? "Not scored"
                : entity.wikidata
                  ? `${entity.wikidata.id}${entity.linkedFromPage ? " · linked" : " · not linked"}`
                  : "Not in Wikidata"
            }
            tone={!entity || entity.platform || !entity.checked ? "neutral" : entity.wikidata ? (entity.linkedFromPage ? "good" : "warn") : "warn"}
          />
        </div>
      </section>

      {/* ── Sheet tabs ── */}
      <nav id="sheet-tabs" aria-label="Survey sections" className="scroll-mt-20 border-b border-signal">
        <div className="thin-scroll -mb-px flex gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`mono shrink-0 border border-b-0 px-3.5 py-2 text-[12px] transition-colors ${
                tab === t.id
                  ? "border-signal bg-surface font-semibold text-signal"
                  : "border-transparent text-ink-dim hover:text-ink"
              }`}
            >
              {t.label}
              {t.id === "issues" && <span className="ml-1.5 text-ink-faint">{report.findings.length}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Summary ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <DefectSchedule
                findings={report.findings}
                limit={6}
                onShowAll={() => go("issues")}
                onRewrite={() => go("geo")}
                onGenerate={() => setGenerateOpen(true)}
              />
            </div>
            <div className="lg:col-span-5">
              <FixPlan report={report} />
            </div>
          </div>

          <section className="title-block" aria-label="Supplementary scores">
            <div className="tb-label">Supplementary scores — heuristics, shown for context; the engine scores above are the survey</div>
            <div className="grid grid-cols-3 !p-0 sm:grid-cols-6 [&>*]:border-r [&>*]:border-line">
              {(
                [
                  ["seo", "Search", vis.seo],
                  ["geo", "Citability", vis.geo],
                  ["crawlers", "Crawlers", vis.crawlers],
                  ["seo", "Technical", vis.technical],
                  ["content", "Content", vis.content],
                  ["schema", "Schema", vis.schema],
                ] as [Tab, string, number][]
              ).map(([t, label, score]) => (
                <button key={label} type="button" onClick={() => go(t)} className="px-3 py-2.5 text-left transition-colors hover:bg-base/60">
                  <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">{label}</div>
                  <div className="num mt-0.5 text-[17px]" style={{ color: scoreColor(score) }}>
                    {score}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 2. SEO AUDIT TAB */}
      {tab === "seo" && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-[16px] font-semibold text-ink">On-Page SEO Diagnostics</h3>
            <p className="text-[12.5px] text-ink-faint mt-1">
              Core metadata, heading structure, and search engine indexability.
            </p>

            <div className="mt-6 space-y-4">
              {/* Title */}
              <div className="rounded-[3px] border border-line bg-surface/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                    Title Tag
                  </span>
                  <span className="mono text-[11px] text-ink-dim">
                    {e.html.title ? `${e.html.title.length} characters` : "Missing"}
                  </span>
                </div>
                <div className="mt-1.5 text-[14px] font-medium text-ink">
                  {e.html.title || "No <title> tag found"}
                </div>
              </div>

              {/* Meta Description */}
              <div className="rounded-[3px] border border-line bg-surface/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                    Meta Description
                  </span>
                  <span className="mono text-[11px] text-ink-dim">
                    {e.html.metaDescription ? `${e.html.metaDescription.length} characters` : "Missing"}
                  </span>
                </div>
                <div className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">
                  {e.html.metaDescription || "No <meta name=\"description\"> tag found"}
                </div>
              </div>

              {/* Headings Hierarchy & Canonical */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-[3px] border border-line bg-surface/50 p-4">
                  <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                    H1 Status
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        e.semantics.h1Count === 1 ? "bg-signal" : "bg-warn"
                      }`}
                    />
                    <span className="text-[14px] font-medium text-ink">
                      {e.semantics.h1Count === 1
                        ? "1 Primary H1 (Optimal)"
                        : `${e.semantics.h1Count} H1 tags detected`}
                    </span>
                  </div>
                </div>

                <div className="rounded-[3px] border border-line bg-surface/50 p-4">
                  <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                    Canonical Tag
                  </span>
                  <div className="mt-1 truncate text-[13px] text-ink">
                    {e.html.canonical || "Missing canonical link"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Card Previews (OG & Twitter) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* OpenGraph Preview */}
            <div className="card p-5">
              <span className="mono text-[11px] uppercase tracking-wider text-ink-faint font-semibold">
                OpenGraph Preview (Facebook / LinkedIn)
              </span>
              <div className="mt-3 rounded-[3px] border border-line bg-surface/80 overflow-hidden">
                {e.openGraph?.image ? (
                  <div className="h-36 w-full bg-raised overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={e.openGraph.image}
                      alt="OG Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center bg-raised text-[12px] text-ink-faint">
                    No og:image specified
                  </div>
                )}
                <div className="p-3.5">
                  <div className="mono text-[10.5px] uppercase text-signal">
                    {e.openGraph?.siteName || new URL(e.finalUrl).hostname}
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-ink line-clamp-1">
                    {e.openGraph?.title || e.html.title || "No OG Title"}
                  </div>
                  <p className="mt-1 text-[11.5px] text-ink-dim line-clamp-2">
                    {e.openGraph?.description || e.html.metaDescription || "No OG Description"}
                  </p>
                </div>
              </div>
            </div>

            {/* Twitter Card Preview */}
            <div className="card p-5">
              <span className="mono text-[11px] uppercase tracking-wider text-ink-faint font-semibold">
                Twitter Card Preview
              </span>
              <div className="mt-3 rounded-[3px] border border-line bg-surface/80 p-3.5 space-y-2">
                <div className="mono text-[11px] text-ink-faint">
                  Card format: <strong className="text-ink">{e.twitter?.card || "Missing"}</strong>
                </div>
                <div className="text-[13px] font-semibold text-ink">
                  {e.twitter?.title || e.html.title || "No Twitter Title"}
                </div>
                <p className="text-[11.5px] text-ink-dim line-clamp-2">
                  {e.twitter?.description || e.html.metaDescription || "No Twitter Description"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GEO & AI CITATIONS TAB */}
      {tab === "geo" && (
        <div className="space-y-6">
          <WeakBlocks
            report={report}
            ai={ai}
          />
        </div>
      )}

      {/* 4. AI CRAWLERS TAB */}
      {tab === "crawlers" && <CrawlerCenter evidence={e} />}

      {/* 5. CONTENT QUALITY TAB */}
      {tab === "content" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="card p-4">
              <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                Word Count
              </span>
              <div className="mt-1 text-[26px] font-semibold text-ink">
                {e.html.textWords.toLocaleString()}
              </div>
              <p className="mt-1 text-[11.5px] text-ink-faint">
                {e.html.textWords >= 600 ? "Substantive article length" : "Thin content risk"}
              </p>
            </div>

            <div className="card p-4">
              <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                Question Headings
              </span>
              <div className="mt-1 text-[26px] font-semibold text-signal">
                {e.signals.questionHeadings}
              </div>
              <p className="mt-1 text-[11.5px] text-ink-faint">
                Phrased as direct questions (What, How, Why)
              </p>
            </div>

            <div className="card p-4">
              <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                Factual Data Signals
              </span>
              <div className="mt-1 text-[26px] font-semibold text-ink">
                {e.signals.stats + e.signals.percentages + e.signals.years}
              </div>
              <p className="mt-1 text-[11.5px] text-ink-faint">
                Numbers, percentages, and verifiable dates
              </p>
            </div>

            <div className="card p-4">
              <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                Citations & Sources
              </span>
              <div className="mt-1 text-[26px] font-semibold text-ink">
                {e.links.externalCitations}
              </div>
              <p className="mt-1 text-[11.5px] text-ink-faint">
                Authoritative non-social outbound domains
              </p>
            </div>
          </div>

          {/* Heading Explorer */}
          <div className="card p-5">
            <h4 className="text-[14.5px] font-semibold text-ink">
              Page Heading Architecture
            </h4>
            <div className="mt-3 max-h-72 overflow-y-auto space-y-1.5 thin-scroll">
              {e.headings.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded px-2.5 py-1 text-[12.5px] hover:bg-surface/50"
                  style={{ paddingLeft: `${(h.level - 1) * 16 + 10}px` }}
                >
                  <span className="mono rounded bg-raised px-1.5 py-0.5 text-[10px] text-ink-faint">
                    H{h.level}
                  </span>
                  <span className="text-ink">{h.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. SCHEMA TAB */}
      {tab === "schema" && <SchemaAnalyzer evidence={e} />}

      {/* 7. ROBOTS.TXT TAB */}
      {tab === "robots" && <RobotsAnalyzer evidence={e} />}

      {tab === "view" && <CrawlerView evidence={e} />}

      {/* 8. ISSUES CENTER TAB */}
      {tab === "issues" && (
        <DefectSchedule
          findings={report.findings}
          onRewrite={() => go("geo")}
          onGenerate={() => setGenerateOpen(true)}
        />
      )}

      {/* ── Modals ── */}
      <ExportModal
        report={report}
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />

      {generateOpen && (
        <Generated
          report={report}
          onClose={() => setGenerateOpen(false)}
        />
      )}
    </div>
  );
}
