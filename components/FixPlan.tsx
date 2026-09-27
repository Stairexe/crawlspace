import type { AuditReport } from "@/lib/types";

/**
 * "Fix first": the fixes worth the most, in order, with the score after each one.
 * Numbers come from re-running Crawlspace's own scorer (lib/scoring/score.ts
 * buildFixPlan) — a projection of the model, labelled as such, not a citation forecast.
 */
export function FixPlan({ report, compact = false }: { report: AuditReport; compact?: boolean }) {
  const plan = report.plan;
  if (!plan) return null;

  if (plan.steps.length === 0) {
    return (
      <section className="plate p-5">
        <div className="tb-label">Fix first</div>
        <p className="mt-2 text-[14px] text-ink-dim">
          No single fix raises this page&apos;s score. What is left is content quality, which the
          passage rewrites address.
        </p>
      </section>
    );
  }

  const steps = compact ? plan.steps.slice(0, 3) : plan.steps;
  const last = steps[steps.length - 1]?.after ?? plan.from;

  return (
    <section className="plate overflow-hidden" aria-labelledby="fixplan-h">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <div className="tb-label">Fix first</div>
          <h3 id="fixplan-h" className="mt-1 text-[18px] leading-tight">
            {plan.from} → {last} in {steps.length} {steps.length === 1 ? "fix" : "fixes"}
          </h3>
        </div>
        <div className="mono text-[11px] text-ink-faint">composite score, all five engines</div>
      </div>

      <ol>
        {steps.map((s, i) => (
          <li
            key={s.checkId}
            className="grid grid-cols-[28px_1fr_auto] items-start gap-3 border-b border-line px-5 py-3 last:border-b-0"
          >
            <span className="callout" data-n={i + 1} aria-hidden />
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-ink">{s.summary}</div>
              <div className="mono mt-0.5 text-[11px] text-ink-faint">
                {s.checkId} · {s.effort} effort
              </div>
              <div className="mt-2 h-[4px] overflow-hidden bg-line" aria-hidden>
                <div className="h-full bg-signal" style={{ width: `${s.after}%` }} />
              </div>
            </div>
            <div className="text-right">
              <div className="num text-[15px] text-good">+{s.gain}</div>
              <div className="mono text-[11px] text-ink-faint">→ {s.after}</div>
            </div>
          </li>
        ))}
      </ol>

      <p className="border-t border-line bg-base/40 px-5 py-3 text-[12px] leading-relaxed text-ink-faint">
        Projected by re-running Crawlspace&apos;s own scoring with each fix done completely. It says
        what this model rewards, not whether an engine will cite the page.
      </p>
    </section>
  );
}
