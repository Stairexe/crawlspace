"use client";

import { useState } from "react";
import type { AuditReport } from "@/lib/types";
import { ENGINES, ENGINE_LABELS } from "@/lib/types";
import { Pill, scoreColor, useCountUp } from "./primitives";
import { CrawlerCenter } from "./CrawlerCenter";
import { SchemaAnalyzer } from "./SchemaAnalyzer";
import { RobotsAnalyzer } from "./RobotsAnalyzer";
import { IssuesCenter } from "./IssuesCenter";
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
  | "issues";

function VisibilityDial({ score }: { score: number }) {
  const animated = useCountUp(score);
  const R = 44;
  const C = 2 * Math.PI * R;
  const color = scoreColor(score);

  return (
    <div className="relative flex h-[110px] w-[110px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-line)" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (C * animated) / 100}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="relative text-center">
        <div className="mono text-[30px] font-bold leading-none" style={{ color }}>
          {animated}
        </div>
        <div className="mono mt-1 text-[9px] uppercase tracking-wider text-ink-faint">
          Visibility
        </div>
      </div>
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

  const criticalIssues = report.findings.filter((f) => f.severity === "critical").length;
  const warningIssues = report.findings.filter((f) => f.severity === "high" || f.severity === "medium").length;
  const recIssues = report.findings.filter((f) => f.severity === "low").length;

  return (
    <div className="space-y-8 rise">
      {/* ── Top Command Bar ── */}
      <div className="card glass-panel p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Target Info & Overall Score */}
          <div className="flex items-center gap-5">
            <VisibilityDial score={vis.overall} />
            <div>
              <div className="flex items-center gap-2">
                <span className="mono text-[11px] uppercase tracking-wider text-signal font-semibold">
                  Website Visibility Intelligence
                </span>
                <span className="mono text-[11px] text-ink-faint">
                  • {new Date(e.fetchedAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="mt-1 text-[20px] font-bold text-ink sm:text-[24px]">
                {e.html.title || new URL(e.finalUrl).hostname}
              </h2>
              <div className="mono mt-1 flex flex-wrap items-center gap-3 text-[12px] text-ink-dim">
                <a
                  href={e.finalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-signal underline decoration-line-bright underline-offset-2"
                >
                  {e.finalUrl}
                </a>
                <span>•</span>
                <span>{e.timings.fetchMs}ms load</span>
                <span>•</span>
                <span>{e.html.textWords.toLocaleString()} words</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="mono h-10 rounded-lg bg-signal px-4 text-[12.5px] font-semibold text-void transition-all hover:brightness-110 shadow-[0_0_16px_var(--color-signal-glow)]"
            >
              Export for LLMs ↗
            </button>
            <button
              type="button"
              onClick={() => setGenerateOpen(true)}
              className="mono h-10 rounded-lg border border-line bg-surface px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-line-bright hover:text-ink"
            >
              Generate Files
            </button>
            <button
              type="button"
              onClick={onReset}
              className="mono h-10 rounded-lg border border-line bg-surface px-3 text-[12.5px] text-ink-dim transition-colors hover:text-ink"
            >
              Scan Again ↻
            </button>
          </div>
        </div>

        {/* Visibility Score Chips Grid */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 border-t border-line/60 pt-5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { id: "seo", label: "SEO", score: vis.seo, desc: "Search fundamentals" },
            { id: "geo", label: "GEO", score: vis.geo, desc: "AI citation readiness" },
            { id: "crawlers", label: "AI Crawlers", score: vis.crawlers, desc: "Bot access & rules" },
            { id: "technical", label: "Technical", score: vis.technical, desc: "Speed & indexability" },
            { id: "content", label: "Content", score: vis.content, desc: "Factual & reading grade" },
            { id: "schema", label: "Schema", score: vis.schema, desc: "JSON-LD entities" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as Tab)}
              className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
                tab === item.id
                  ? "border-signal bg-signal/10"
                  : "border-line bg-surface/50 hover:border-line-bright"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="mono text-[11px] uppercase tracking-wider text-ink-faint font-semibold">
                  {item.label}
                </span>
                <span
                  className="mono text-[16px] font-bold"
                  style={{ color: scoreColor(item.score) }}
                >
                  {item.score}
                </span>
              </div>
              <span className="mt-1 text-[11px] text-ink-dim">{item.desc}</span>
            </button>
          ))}
        </div>

        {/* Issues Summary Pill Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface/40 px-4 py-2.5">
          <div className="flex items-center gap-3 text-[12.5px]">
            <span className="mono font-semibold text-ink">
              {report.findings.length} Issues Detected:
            </span>
            <span className="mono flex items-center gap-1.5 text-danger">
              <span className="h-2 w-2 rounded-full bg-danger" />
              {criticalIssues} Critical
            </span>
            <span className="mono flex items-center gap-1.5 text-warn">
              <span className="h-2 w-2 rounded-full bg-warn" />
              {warningIssues} Warnings
            </span>
            <span className="mono flex items-center gap-1.5 text-ink-dim">
              <span className="h-2 w-2 rounded-full bg-ink-faint" />
              {recIssues} Recommendations
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTab("issues")}
            className="mono text-[11.5px] text-signal hover:underline"
          >
            Inspect in Issues Center →
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-2">
        {[
          { id: "overview", label: "Overview" },
          { id: "seo", label: "SEO Audit" },
          { id: "geo", label: "GEO & AI Citations" },
          { id: "crawlers", label: "AI Crawlers" },
          { id: "content", label: "Content Quality" },
          { id: "schema", label: "Structured Data" },
          { id: "robots", label: "Robots.txt" },
          { id: "issues", label: `Issues (${report.findings.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as Tab)}
            className={`mono rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition-all ${
              tab === t.id
                ? "bg-signal text-void font-bold shadow-[0_0_12px_var(--color-signal-glow)]"
                : "text-ink-dim hover:bg-surface hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Views ── */}

      {/* 1. OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Engine Scores Breakdown */}
          <div className="card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
              <div>
                <h3 className="text-[16px] font-semibold text-ink">
                  AI Assistant Citability Spread
                </h3>
                <p className="text-[12.5px] text-ink-faint">
                  How citable this page is to 5 different AI search engines based on their documented retrieval rules.
                </p>
              </div>
              <div className="mono text-[12px] text-ink-dim">
                Spread: <strong className="text-signal">{report.spread} pts</strong> (higher spread = engine-specific bias)
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {ENGINES.map((engine) => {
                const s = report.engines[engine];
                const color = scoreColor(s.score);
                return (
                  <div
                    key={engine}
                    className="flex flex-col justify-between rounded-xl border border-line bg-surface/60 p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-ink">
                          {ENGINE_LABELS[engine]}
                        </span>
                        {s.capped && (
                          <Pill fg="var(--color-danger)" bg="rgba(255,107,94,0.15)">
                            Blocked
                          </Pill>
                        )}
                      </div>
                      <div className="mono mt-3 text-[32px] font-bold" style={{ color }}>
                        {s.score}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${s.score}%`, background: color }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
                        {s.capped ? s.capReason : s.score >= 75 ? "High citation likelihood" : "Moderate extraction barriers"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Facts Matrix */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card p-4">
              <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                Robots.txt
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${e.robots.found ? "bg-signal" : "bg-warn"}`} />
                <span className="text-[14.5px] font-semibold text-ink">
                  {e.robots.found ? "Active" : "None"}
                </span>
              </div>
            </div>
            <div className="card p-4">
              <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                llms.txt Guidance
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${e.llmsTxt.found ? "bg-signal" : "bg-ink-faint"}`} />
                <span className="text-[14.5px] font-semibold text-ink">
                  {e.llmsTxt.found ? "Detected" : "Missing (Optional)"}
                </span>
              </div>
            </div>
            <div className="card p-4">
              <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                XML Sitemap
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${e.sitemap.found ? "bg-signal" : "bg-warn"}`} />
                <span className="text-[14.5px] font-semibold text-ink">
                  {e.sitemap.found ? "Found" : "Missing"}
                </span>
              </div>
            </div>
            <div className="card p-4">
              <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                Renders Without JS
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${e.renderedWithoutJs ? "bg-signal" : "bg-danger"}`} />
                <span className="text-[14.5px] font-semibold text-ink">
                  {e.renderedWithoutJs ? "SSR Confirmed" : "JS Shell"}
                </span>
              </div>
            </div>
          </div>

          {/* Top Priority Issues Preview */}
          <div className="card p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h4 className="text-[14.5px] font-semibold text-ink">
                Priority Action Items
              </h4>
              <button
                type="button"
                onClick={() => setTab("issues")}
                className="mono text-[11.5px] text-signal hover:underline"
              >
                View all {report.findings.length} findings →
              </button>
            </div>
            <div className="mt-3 divide-y divide-line">
              {report.findings.slice(0, 3).map((f) => (
                <div key={f.checkId} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Pill
                        fg={
                          f.severity === "critical"
                            ? "var(--color-danger)"
                            : f.severity === "high"
                            ? "var(--color-warn)"
                            : "var(--color-signal)"
                        }
                        bg="rgba(255,255,255,0.05)"
                      >
                        {f.severity.toUpperCase()}
                      </Pill>
                      <span className="text-[13.5px] font-medium text-ink">{f.label}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-ink-dim">{f.fix.summary}</p>
                  </div>
                  <span className="mono text-[11.5px] text-ink-faint whitespace-nowrap">
                    Effort: {f.effort}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
              <div className="rounded-lg border border-line bg-surface/50 p-4">
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
              <div className="rounded-lg border border-line bg-surface/50 p-4">
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
                <div className="rounded-lg border border-line bg-surface/50 p-4">
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

                <div className="rounded-lg border border-line bg-surface/50 p-4">
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
              <div className="mt-3 rounded-lg border border-line bg-surface/80 overflow-hidden">
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
              <div className="mt-3 rounded-lg border border-line bg-surface/80 p-3.5 space-y-2">
                <div className="mono text-[11px] text-ink-faint">
                  Card format: <strong className="text-ink">{e.twitter?.card || "summary"}</strong>
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

      {/* 8. ISSUES CENTER TAB */}
      {tab === "issues" && (
        <IssuesCenter
          findings={report.findings}
          onSelectRewritable={() => setTab("geo")}
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
