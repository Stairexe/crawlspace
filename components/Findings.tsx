"use client";

import { useState } from "react";
import type { Finding } from "@/lib/types";
import { CATEGORY_LABELS, ENGINE_SHORT } from "@/lib/types";
import { EFFORT_LABEL, Pill, SEVERITY_STYLE } from "./primitives";

function FindingRow({ finding, index }: { finding: Finding; index: number }) {
  const [open, setOpen] = useState(index < 2);
  const sev = SEVERITY_STYLE[finding.severity];

  return (
    <li
      className="rise border-b border-line last:border-b-0"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-raised/60"
      >
        <span
          aria-hidden
          className="mt-[7px] block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: sev.fg }}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-[13.5px] font-medium text-ink">{finding.fix.summary}</span>
            <Pill fg={sev.fg} bg={sev.bg}>
              {sev.label}
            </Pill>
            <Pill>{EFFORT_LABEL[finding.effort]}</Pill>
          </span>
          <span className="mono mt-1 block text-[11px] text-ink-faint">
            {CATEGORY_LABELS[finding.category]} · affects{" "}
            {finding.engines.length === 5
              ? "all five engines"
              : finding.engines.map((e) => ENGINE_SHORT[e]).join(", ")}
          </span>
        </span>
        <span
          aria-hidden
          className="mono mt-0.5 shrink-0 text-[11px] text-ink-faint transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        >
          ›
        </span>
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4 pl-[30px]">
          <div className="rounded-lg border border-line bg-base px-3 py-2.5">
            <div className="mono mb-1 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              what we found
            </div>
            <p className="mono text-[12px] leading-relaxed text-ink-dim">{finding.evidence}</p>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-dim">{finding.fix.detail}</p>
        </div>
      )}
    </li>
  );
}

export function Findings({ findings }: { findings: Finding[] }) {
  const [filter, setFilter] = useState<"all" | "quick">("all");
  const shown =
    filter === "quick"
      ? findings.filter((f) => f.effort === "trivial" || f.effort === "small")
      : findings;

  if (findings.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[14px] text-ink-dim">
          No findings. Every check that carries weight passed — that is rare, and worth keeping.
        </p>
      </div>
    );
  }

  const counts = {
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    quick: findings.filter((f) => f.effort === "trivial" || f.effort === "small").length,
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-tight">
          What to fix{" "}
          <span className="mono ml-1 text-[12px] font-normal text-ink-faint">
            {findings.length} findings
            {counts.critical > 0 && ` · ${counts.critical} critical`}
          </span>
        </h2>
        <div className="mono flex overflow-hidden rounded-md border border-line text-[11px]">
          {(
            [
              ["all", `all ${findings.length}`],
              ["quick", `quick wins ${counts.quick}`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 transition-colors ${
                filter === key ? "bg-raised text-ink" : "text-ink-faint hover:text-ink-dim"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="card overflow-hidden">
        {shown.map((f, i) => (
          <FindingRow key={f.checkId} finding={f} index={i} />
        ))}
      </ul>
    </section>
  );
}
