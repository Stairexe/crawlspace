import Link from "next/link";
import { ENGINES, ENGINE_LABELS } from "@/lib/types";
import type { Specimen } from "@/lib/demo";

/**
 * Server-rendered. Every number here came out of the engine when this page was built.
 * Nothing on this component is authored by hand — if the engine returns 42, it says 42.
 */

function band(score: number): string {
  if (score >= 80) return "Sound";
  if (score >= 60) return "Serviceable";
  if (score >= 40) return "Defective";
  return "Not usable";
}

function severityRank(s: string): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[s] ?? 4;
}

export function LiveSpecimen({ specimen }: { specimen: Specimen }) {
  if (!specimen.ok || !specimen.report) {
    return (
      <div>
        <div className="card p-8">
          <p className="mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            Specimen survey
          </p>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-dim">
            {specimen.reason} Rather than show a stand-in, this panel stays empty — the
            same rule the reports follow. Run an audit above to see live output.
          </p>
        </div>
      </div>
    );
  }

  const r = specimen.report;
  const host = (() => {
    try {
      return new URL(r.evidence.finalUrl).host;
    } catch {
      return specimen.url;
    }
  })();

  const topFindings = [...r.findings]
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 4);

  const best = [...ENGINES].sort((a, b) => r.engines[b].score - r.engines[a].score)[0];
  const worst = [...ENGINES].sort((a, b) => r.engines[a].score - r.engines[b].score)[0];

  return (
    <div>
      {/* Title block — the survey document's identity strip */}
      <div className="plate overflow-hidden">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-line p-5 sm:grid-cols-4">
          {[
            ["Specimen", host],
            ["Inspected", new Date(r.evidence.fetchedAt).toISOString().slice(0, 10)],
            ["Blocks surveyed", String(r.evidence.blocks.length)],
            ["Defects raised", String(r.findings.length)],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {k}
              </div>
              <div className="mono mt-1 truncate text-[13px] text-ink" title={v}>
                {k === "Inspected" ? <time dateTime={r.evidence.fetchedAt}>{v}</time> : v}
              </div>
            </div>
          ))}
        </div>

        {/* The five schedules */}
        <div className="p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-ink">
              Five schedules, one measured page
            </h3>
            <span className="mono text-[11px] text-ink-faint">
              {r.spread}-point spread
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {ENGINES.map((e) => {
              const s = r.engines[e];
              return (
                <div key={e}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-ink-dim">{ENGINE_LABELS[e]}</span>
                    <span className="mono text-[13px] font-semibold text-ink">
                      {s.score}
                      <span className="ml-2 text-[11px] font-normal text-ink-faint">
                        {s.capped ? "not inspected" : band(s.score)}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-[6px] overflow-hidden bg-line">
                    <div
                      className={`h-full ${s.capped ? "bg-danger" : "bg-signal"}`}
                      style={{ width: `${Math.max(2, s.score)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-5 border-t border-line pt-4 text-[13.5px] leading-relaxed text-ink-dim">
            {r.spread >= 8 ? (
              <>
                The same evidence produces a {r.spread}-point gap: {ENGINE_LABELS[best]} scores{" "}
                {r.engines[best].score} and {ENGINE_LABELS[worst]} scores{" "}
                {r.engines[worst].score}. A single blended number would have hidden that.
              </>
            ) : (
              <>
                The five scores are within {r.spread} points of each other on this page, so every
                defect below improves all of them at once.
              </>
            )}
          </p>
        </div>

        {/* Defect schedule */}
        {topFindings.length > 0 && (
          <div className="border-t border-line">
            <div className="mono flex items-center justify-between border-b border-line px-5 py-2.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              <span>Defect schedule — first {topFindings.length}</span>
              <span>Severity</span>
            </div>
            <ul>
              {topFindings.map((f, i) => (
                <li
                  key={f.checkId}
                  className="flex items-start gap-4 border-b border-line px-5 py-3 last:border-b-0"
                >
                  <span className="callout shrink-0" data-n={i + 1} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] text-ink">{f.fix.summary}</span>
                    <span className="mono mt-1 block truncate text-[11px] text-ink-faint">
                      {f.evidence}
                    </span>
                  </span>
                  <span className="mono shrink-0 pt-0.5 text-[10px] uppercase tracking-[0.12em] text-ink-dim">
                    {f.severity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas not inspected — the surveyor's refusal to guess */}
        <div className="border-t border-line bg-base/40 p-5">
          <div className="mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Areas not inspected
          </div>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-faint">
            Whether this page is actually cited. Anything off its own domain — brands are
            cited far more often through third parties than through their own site.
            Backlinks and domain authority. Pages other than this one. The scoring model
            itself has not been validated against citation outcomes;{" "}
            <Link href="/methodology" className="text-ink-dim underline underline-offset-4">
              the methodology page
            </Link>{" "}
            states every weight and every limit.
          </p>
        </div>
      </div>

      <p className="mono mt-3 text-center text-[11px] text-ink-faint">
        This is live output from the engine, refreshed at most once a day. It is not a mockup.
      </p>
    </div>
  );
}
