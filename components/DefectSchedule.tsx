"use client";

import { useId, useState } from "react";
import type { Category, Engine, Finding, Severity } from "@/lib/types";
import { CATEGORY_LABELS, ENGINES, ENGINE_LABELS } from "@/lib/types";
import { EFFORT_LABEL } from "./primitives";

/**
 * The defect schedule: every finding as a numbered row, the way a building survey lists
 * defects — number, defect, where it bites (which engines), severity, and the work.
 * Survey red is reserved for critical and high; nothing else on the sheet uses it.
 */

const ENGINE_ABBR: Record<Engine, string> = {
  "google-aio": "AIO",
  chatgpt: "GPT",
  perplexity: "PPX",
  claude: "CLD",
  copilot: "CPL",
};

const SEV: Record<Severity, { label: string; cls: string }> = {
  critical: { label: "Critical", cls: "text-danger border-danger" },
  high: { label: "High", cls: "text-danger border-danger/50" },
  medium: { label: "Medium", cls: "text-signal border-signal/50" },
  low: { label: "Low", cls: "text-ink-faint border-line-bright" },
};

const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low"];

export function defectNo(i: number): string {
  return `D-${String(i + 1).padStart(2, "0")}`;
}

export function DefectSchedule({
  findings,
  limit,
  onShowAll,
  onRewrite,
  onGenerate,
  title = "Defect schedule",
}: {
  findings: Finding[];
  /** Show only the first n rows (the overview), with a link to the full schedule. */
  limit?: number;
  onShowAll?: () => void;
  onRewrite?: () => void;
  onGenerate?: () => void;
  title?: string;
}) {
  const [sev, setSev] = useState<"all" | Severity>("all");
  const [cat, setCat] = useState<"all" | Category>("all");
  const [open, setOpen] = useState<string | null>(null);
  const headingId = useId();

  // Numbers are fixed by position in the full schedule, so D-04 means the same defect
  // whether the list is filtered or not.
  const numbered = findings.map((f, i) => ({ f, no: defectNo(i) }));
  const filtered = numbered.filter(({ f }) => (sev === "all" || f.severity === sev) && (cat === "all" || f.category === cat));
  const rows = limit ? filtered.slice(0, limit) : filtered;
  const counts = Object.fromEntries(SEV_ORDER.map((s) => [s, findings.filter((f) => f.severity === s).length])) as Record<Severity, number>;
  const cats = (Object.keys(CATEGORY_LABELS) as Category[]).filter((c) => findings.some((f) => f.category === c));

  if (findings.length === 0) {
    return (
      <section className="plate p-5" aria-labelledby={headingId}>
        <div className="tb-label">{title}</div>
        <h3 id={headingId} className="mt-1 text-[18px]">
          No defects recorded.
        </h3>
        <p className="mt-2 text-[13.5px] text-ink-dim">Every check this survey runs passed or did not apply.</p>
      </section>
    );
  }

  return (
    <section className="plate overflow-hidden" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <div className="tb-label">{title}</div>
          <h3 id={headingId} className="mt-1 text-[18px] leading-tight">
            {findings.length} {findings.length === 1 ? "defect" : "defects"}
            {counts.critical > 0 && <span className="text-danger"> · {counts.critical} critical</span>}
          </h3>
        </div>
        {!limit && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by severity">
            <FilterChip active={sev === "all"} onClick={() => setSev("all")}>
              All {findings.length}
            </FilterChip>
            {SEV_ORDER.filter((s) => counts[s] > 0).map((s) => (
              <FilterChip key={s} active={sev === s} onClick={() => setSev((v) => (v === s ? "all" : s))}>
                {SEV[s].label} {counts[s]}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {!limit && cats.length > 1 && (
        <div className="flex flex-wrap gap-1.5 border-b border-line bg-base/40 px-5 py-2.5" role="group" aria-label="Filter by category">
          <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
            Every category
          </FilterChip>
          {cats.map((c) => (
            <FilterChip key={c} active={cat === c} onClick={() => setCat((v) => (v === c ? "all" : c))}>
              {CATEGORY_LABELS[c]}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Column heads — hidden on phones, where each row stacks. */}
      <div
        aria-hidden
        className="mono hidden grid-cols-[56px_1fr_150px_84px_96px] gap-3 border-b border-line px-5 py-2 text-[10px] uppercase tracking-[0.12em] text-ink-faint md:grid"
      >
        <span>No.</span>
        <span>Defect and evidence</span>
        <span>Engines affected</span>
        <span>Severity</span>
        <span className="text-right">Work</span>
      </div>

      <ol>
        {rows.map(({ f, no }) => {
          const isOpen = open === f.checkId;
          const detailId = `${headingId}-${f.checkId}`;
          return (
            <li key={f.checkId} className="border-b border-line last:border-b-0">
              <div className="grid grid-cols-[56px_1fr] gap-x-3 gap-y-2 px-5 py-3.5 md:grid-cols-[56px_1fr_150px_84px_96px] md:items-start">
                <span className={`mono pt-0.5 text-[12px] font-semibold ${f.severity === "critical" || f.severity === "high" ? "text-danger" : "text-ink-dim"}`}>
                  {no}
                </span>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : f.checkId)}
                    aria-expanded={isOpen}
                    aria-controls={detailId}
                    className="text-left text-[14px] font-semibold leading-snug text-ink underline-offset-4 hover:underline"
                  >
                    {f.label}
                  </button>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">{f.evidence}</p>
                  <p className="mono mt-1 text-[10.5px] text-ink-faint">
                    {f.status === "fail" ? "Fails" : "Partly met"} · {f.checkId}
                  </p>
                </div>

                <div className="col-start-2 md:col-start-auto">
                  <div className="flex gap-1" role="img" aria-label={`Affects ${f.engines.map((e) => ENGINE_LABELS[e]).join(", ")}`}>
                    {ENGINES.map((e) => {
                      const hit = f.engines.includes(e);
                      return (
                        <span
                          key={e}
                          title={ENGINE_LABELS[e]}
                          aria-hidden
                          className={`mono inline-flex h-[22px] w-[27px] items-center justify-center border text-[9px] ${
                            hit ? "border-signal bg-signal text-void" : "border-dashed border-line-bright text-ink-faint"
                          }`}
                        >
                          {ENGINE_ABBR[e]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="col-start-2 flex items-center gap-3 md:col-start-auto md:block">
                  <span className={`mono inline-block border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] ${SEV[f.severity].cls}`}>
                    {SEV[f.severity].label}
                  </span>
                  <span className="mono text-[11px] text-ink-faint md:hidden">{EFFORT_LABEL[f.effort]}</span>
                </div>

                <span className="mono hidden text-right text-[11px] text-ink-faint md:block">{EFFORT_LABEL[f.effort]}</span>
              </div>

              {isOpen && (
                <div id={detailId} className="grid grid-cols-[56px_1fr] gap-3 border-t border-dashed border-line bg-base/40 px-5 py-4">
                  <span className="mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">Work</span>
                  <div className="min-w-0 space-y-2">
                    <div className="text-[13.5px] font-semibold text-ink">{f.fix.summary}</div>
                    <p className="text-[13px] leading-relaxed text-ink-dim">{f.fix.detail}</p>
                    <div className="mono flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-ink-faint">
                      <span>{f.checkId}</span>
                      <span>{CATEGORY_LABELS[f.category]}</span>
                      {f.fix.rewritable && onRewrite && (
                        <button type="button" onClick={onRewrite} className="text-signal underline underline-offset-4">
                          Rewrite the weak passages →
                        </button>
                      )}
                      {f.fix.generates && onGenerate && (
                        <button type="button" onClick={onGenerate} className="text-signal underline underline-offset-4">
                          Generate {f.fix.generates === "jsonld" ? "the JSON-LD" : "llms.txt"} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {rows.length === 0 && (
        <p className="px-5 py-6 text-[13px] text-ink-faint">Nothing matches that filter.</p>
      )}

      {limit && findings.length > rows.length && onShowAll && (
        <div className="border-t border-line px-5 py-3">
          <button type="button" onClick={onShowAll} className="mono text-[12px] text-signal underline underline-offset-4">
            Full schedule — all {findings.length} defects →
          </button>
        </div>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`mono border px-2 py-1 text-[11px] transition-colors ${
        active ? "border-signal bg-signal text-void" : "border-line bg-surface text-ink-dim hover:border-line-bright hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
