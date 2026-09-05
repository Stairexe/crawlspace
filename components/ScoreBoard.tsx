"use client";

import type { AuditReport } from "@/lib/types";
import {
  CATEGORIES,
  CATEGORY_BLURBS,
  CATEGORY_LABELS,
  ENGINES,
  ENGINE_LABELS,
} from "@/lib/types";
import { ENGINE_RATIONALE } from "@/lib/scoring/weights";
import { Pill, scoreColor, scoreLabel, useCountUp } from "./primitives";

function Dial({ score }: { score: number }) {
  const animated = useCountUp(score);
  const R = 62;
  const C = 2 * Math.PI * R;
  const color = scoreColor(score);

  return (
    <div className="relative flex h-[164px] w-[164px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--color-line)" strokeWidth="7" />
        <circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (C * animated) / 100}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="relative text-center">
        <div className="mono text-[46px] font-semibold leading-none" style={{ color }}>
          {animated}
        </div>
        <div className="mono mt-1.5 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          composite
        </div>
      </div>
    </div>
  );
}

function EngineRow({
  label,
  score,
  capped,
  capReason,
  rationale,
  delay,
}: {
  label: string;
  score: number;
  capped: boolean;
  capReason?: string;
  rationale: string;
  delay: number;
}) {
  const color = scoreColor(score);
  return (
    <div className="rise group" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 text-[13px] text-ink">
          {label}
          {capped && (
            <Pill fg="var(--color-danger)" bg="rgba(255,107,94,0.13)" title={capReason}>
              blocked
            </Pill>
          )}
        </span>
        <span className="mono text-[13px] font-semibold" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            background: color,
            transition: "width 900ms cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
      <p className="mt-1.5 max-h-0 overflow-hidden text-[11.5px] leading-relaxed text-ink-faint opacity-0 transition-all duration-300 group-hover:max-h-24 group-hover:opacity-100">
        {capped ? capReason : rationale}
      </p>
    </div>
  );
}

/** The handful of binary facts a practitioner checks first. */
function glanceFacts(report: AuditReport): [string, string, boolean | null][] {
  const e = report.evidence;
  const schemaTypes = new Set(e.jsonLd.flatMap((n) => n.types));
  const blockedCount = Object.values(e.robots.rules).filter(
    (r) => !r.allowed && r.agent !== "CCBot",
  ).length;
  return [
    ["robots.txt", e.robots.found ? "found" : "missing", e.robots.found],
    [
      "AI crawlers",
      blockedCount === 0 ? "all allowed" : `${blockedCount} blocked`,
      blockedCount === 0,
    ],
    ["llms.txt", e.llmsTxt.found ? (e.llmsTxt.valid ? "valid" : "invalid") : "missing", e.llmsTxt.found && e.llmsTxt.valid],
    ["sitemap", e.sitemap.found ? "found" : "missing", e.sitemap.found],
    ["schema", schemaTypes.size ? `${schemaTypes.size} types` : "none", schemaTypes.size > 0],
    ["author", e.author.name ? "named" : "anonymous", !!e.author.name],
    [
      "last updated",
      e.dates.modified ? e.dates.modified.slice(0, 10) : e.dates.published ? e.dates.published.slice(0, 10) : "undated",
      !!(e.dates.modified || e.dates.published),
    ],
    ["renders w/o JS", e.renderedWithoutJs ? "yes" : "no", e.renderedWithoutJs],
  ];
}

export function ScoreBoard({ report }: { report: AuditReport }) {
  const best = [...ENGINES].sort((a, b) => report.engines[b].score - report.engines[a].score)[0];
  const worst = [...ENGINES].sort((a, b) => report.engines[a].score - report.engines[b].score)[0];

  // Category score is engine-independent; recompute the display value from the checks.
  const categoryValues = Object.fromEntries(
    CATEGORIES.map((c) => {
      const relevant = report.checks.filter(
        (x) => x.category === c && x.weight > 0 && x.status !== "na",
      );
      const tw = relevant.reduce((n, x) => n + x.weight, 0);
      return [c, tw ? Math.round((relevant.reduce((n, x) => n + x.value * x.weight, 0) / tw) * 100) : 0];
    }),
  ) as Record<(typeof CATEGORIES)[number], number>;

  return (
    <section className="space-y-4">
      <div className="card rise overflow-hidden p-6 sm:p-7">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex items-center gap-6">
            <Dial score={report.composite} />
            <div className="min-w-0">
              <div
                className="mono text-[11px] uppercase tracking-[0.16em]"
                style={{ color: scoreColor(report.composite) }}
              >
                {scoreLabel(report.composite)}
              </div>
              <h2 className="mt-2 text-[19px] font-semibold leading-snug tracking-tight">
                {report.evidence.html.title ?? "Untitled page"}
              </h2>
              <a
                href={report.evidence.finalUrl}
                target="_blank"
                rel="noreferrer"
                className="mono mt-1 block truncate text-[12px] text-ink-faint transition-colors hover:text-signal"
              >
                {report.evidence.finalUrl}
              </a>
              <div className="mono mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-faint">
                <span>{report.evidence.html.textWords.toLocaleString()} words</span>
                <span>{report.evidence.blocks.length} blocks</span>
                <span>{(report.evidence.timings.totalMs / 1000).toFixed(1)}s</span>
              </div>

              <dl className="mt-5 grid max-w-sm grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-4">
                {glanceFacts(report).map(([label, value, ok]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="mono text-[11px] text-ink-faint">{label}</dt>
                    <dd
                      className="mono text-[11px]"
                      style={{
                        color:
                          ok === null
                            ? "var(--color-ink-dim)"
                            : ok
                              ? "var(--color-good)"
                              : "var(--color-warn)",
                      }}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="flex-1 lg:border-l lg:border-line lg:pl-8">
            <div className="mb-3.5 flex items-baseline justify-between">
              <h3 className="mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                per engine
              </h3>
              {report.spread >= 8 && (
                <span className="mono text-[11px] text-ink-faint">
                  {report.spread}-point spread
                </span>
              )}
            </div>
            <div className="space-y-3.5">
              {ENGINES.map((engine, i) => (
                <EngineRow
                  key={engine}
                  label={ENGINE_LABELS[engine]}
                  score={report.engines[engine].score}
                  capped={report.engines[engine].capped}
                  capReason={report.engines[engine].capReason}
                  rationale={ENGINE_RATIONALE[engine]}
                  delay={i * 70}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="mt-7 border-t border-line pt-5 text-[14.5px] leading-relaxed text-ink-dim">
          {report.summary}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c, i) => {
          const v = categoryValues[c];
          return (
            <div
              key={c}
              className="card rise p-4"
              style={{ animationDelay: `${180 + i * 45}ms` }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium">{CATEGORY_LABELS[c]}</span>
                <span className="mono text-[15px] font-semibold" style={{ color: scoreColor(v) }}>
                  {v}
                </span>
              </div>
              <div className="mt-2.5 h-[4px] overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${v}%`,
                    background: scoreColor(v),
                    transition: "width 800ms cubic-bezier(0.16,1,0.3,1)",
                    transitionDelay: `${180 + i * 45}ms`,
                  }}
                />
              </div>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-faint">
                {CATEGORY_BLURBS[c]}
              </p>
            </div>
          );
        })}
      </div>

      {report.spread >= 8 && (
        <div className="card rise flex items-start gap-3 p-4" style={{ animationDelay: "460ms" }}>
          <span
            aria-hidden
            className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-signal"
          />
          <p className="text-[13px] leading-relaxed text-ink-dim">
            <span className="text-ink">The engines disagree by {report.spread} points.</span>{" "}
            {ENGINE_LABELS[best]} scores {report.engines[best].score} and {ENGINE_LABELS[worst]}{" "}
            scores {report.engines[worst].score} on identical evidence, because they weight it
            differently. Optimise for the one your audience actually uses — a single blended
            number would have hidden this.
          </p>
        </div>
      )}
    </section>
  );
}
