"use client";

import { useState } from "react";
import type { Category, Finding, Severity } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";
import { Pill } from "./primitives";

export function IssuesCenter({
  findings,
  onSelectRewritable,
}: {
  findings: Finding[];
  onSelectRewritable?: () => void;
}) {
  const [catFilter, setCatFilter] = useState<"all" | Category>("all");
  const [sevFilter, setSevFilter] = useState<"all" | Severity>("all");

  const filtered = findings.filter((f) => {
    if (catFilter !== "all" && f.category !== catFilter) return false;
    if (sevFilter !== "all" && f.severity !== sevFilter) return false;
    return true;
  });

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;
  const medCount = findings.filter((f) => f.severity === "medium").length;
  const lowCount = findings.filter((f) => f.severity === "low").length;

  return (
    <div className="space-y-6">
      {/* Priority Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setSevFilter((s) => (s === "critical" ? "all" : "critical"))}
          className={`card flex flex-col p-4 text-left transition-all ${
            sevFilter === "critical" ? "border-danger bg-danger/10" : "hover:border-line-bright"
          }`}
        >
          <span className="mono text-[11px] uppercase tracking-wider text-danger font-semibold">
            Critical
          </span>
          <span className="mt-1 text-[28px] font-bold text-ink">{criticalCount}</span>
          <span className="text-[11.5px] text-ink-faint">Hard gates & blockouts</span>
        </button>

        <button
          type="button"
          onClick={() => setSevFilter((s) => (s === "high" ? "all" : "high"))}
          className={`card flex flex-col p-4 text-left transition-all ${
            sevFilter === "high" ? "border-warn bg-warn/10" : "hover:border-line-bright"
          }`}
        >
          <span className="mono text-[11px] uppercase tracking-wider text-warn font-semibold">
            High Priority
          </span>
          <span className="mt-1 text-[28px] font-bold text-ink">{highCount}</span>
          <span className="text-[11.5px] text-ink-faint">Substantial point loss</span>
        </button>

        <button
          type="button"
          onClick={() => setSevFilter((s) => (s === "medium" ? "all" : "medium"))}
          className={`card flex flex-col p-4 text-left transition-all ${
            sevFilter === "medium" ? "border-signal bg-signal/10" : "hover:border-line-bright"
          }`}
        >
          <span className="mono text-[11px] uppercase tracking-wider text-signal font-semibold">
            Medium / Warnings
          </span>
          <span className="mt-1 text-[28px] font-bold text-ink">{medCount}</span>
          <span className="text-[11.5px] text-ink-faint">Optimization targets</span>
        </button>

        <button
          type="button"
          onClick={() => setSevFilter((s) => (s === "low" ? "all" : "low"))}
          className={`card flex flex-col p-4 text-left transition-all ${
            sevFilter === "low" ? "border-ink-faint bg-raised" : "hover:border-line-bright"
          }`}
        >
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint font-semibold">
            Recommendations
          </span>
          <span className="mt-1 text-[28px] font-bold text-ink">{lowCount}</span>
          <span className="text-[11.5px] text-ink-faint">Fine-tuning enhancements</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCatFilter("all")}
            className={`mono rounded-md px-2.5 py-1 text-[11.5px] transition-colors ${
              catFilter === "all"
                ? "bg-signal text-void font-bold"
                : "bg-surface text-ink-dim hover:text-ink"
            }`}
          >
            All Categories ({findings.length})
          </button>
          {(
            [
              "extractability",
              "answer-structure",
              "evidence-density",
              "machine-readability",
              "authority",
              "retrievability",
            ] as Category[]
          ).map((cat) => {
            const count = findings.filter((f) => f.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCatFilter((c) => (c === cat ? "all" : cat))}
                className={`mono rounded-md px-2.5 py-1 text-[11.5px] transition-colors ${
                  catFilter === cat
                    ? "bg-signal text-void font-bold"
                    : "bg-surface text-ink-dim hover:text-ink"
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>
        <span className="mono text-[11px] text-ink-faint">
          {filtered.length} matching issues
        </span>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((f) => (
            <div
              key={f.checkId}
              className="card overflow-hidden p-5 transition-colors hover:border-line-bright"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {f.severity === "critical" && (
                    <Pill fg="var(--color-danger)" bg="rgba(255,107,94,0.15)">
                      CRITICAL
                    </Pill>
                  )}
                  {f.severity === "high" && (
                    <Pill fg="var(--color-warn)" bg="rgba(245,181,68,0.15)">
                      HIGH
                    </Pill>
                  )}
                  {f.severity === "medium" && (
                    <Pill fg="var(--color-signal)" bg="rgba(59,244,138,0.12)">
                      MEDIUM
                    </Pill>
                  )}
                  {f.severity === "low" && (
                    <Pill fg="var(--color-ink-faint)" bg="rgba(107,116,130,0.15)">
                      RECOMMENDED
                    </Pill>
                  )}
                  <h4 className="text-[14.5px] font-semibold text-ink">{f.label}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono rounded bg-raised px-2 py-0.5 text-[11px] text-ink-faint">
                    {CATEGORY_LABELS[f.category]}
                  </span>
                  <span className="mono rounded bg-raised px-2 py-0.5 text-[11px] text-ink-faint">
                    Effort: {f.effort}
                  </span>
                </div>
              </div>

              {/* Evidence Bar */}
              <div className="mt-3 rounded-lg border border-line bg-surface/60 p-3">
                <div className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                  Evidence on page
                </div>
                <div className="mono mt-1 text-[12.5px] text-ink-dim">{f.evidence}</div>
              </div>

              {/* Action Directive */}
              <div className="mt-3 space-y-1">
                <div className="text-[13.5px] font-medium text-ink">
                  Fix: {f.fix.summary}
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-dim">
                  {f.fix.detail}
                </p>
              </div>

              {/* Action Buttons */}
              {f.fix.rewritable && onSelectRewritable && (
                <div className="mt-4 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={onSelectRewritable}
                    className="mono inline-flex items-center gap-1.5 rounded-md border border-signal/30 bg-signal/10 px-3 py-1 text-[11.5px] font-semibold text-signal hover:bg-signal/20"
                  >
                    Open Passage in AI Rewriter →
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="card py-12 text-center text-ink-faint flex flex-col items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-signal mb-2" />
            <p className="text-[14px]">No issues match the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
