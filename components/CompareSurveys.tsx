"use client";

import { useEffect, useState } from "react";
import type { AuditReport, CheckResult } from "@/lib/types";
import { ENGINES, ENGINE_LABELS } from "@/lib/types";
import { isReport, readLastReport } from "@/lib/lastReport";

/**
 * Before / after for two surveys. Everything runs in the browser from exported JSON
 * files (or the survey in this tab) — nothing is uploaded or stored.
 */
type Slot = { report: AuditReport; name: string } | null;

const RANK: Record<CheckResult["status"], number> = { fail: 0, warn: 1, pass: 2, na: -1 };

function FilePick({ label, slot, onLoad }: { label: string; slot: Slot; onLoad: (s: Slot, err?: string) => void }) {
  return (
    <div className="title-block">
      <div>
        <div className="tb-label">{label}</div>
        <div className="tb-value truncate">
          {slot ? `${new URL(slot.report.evidence.finalUrl).host} · ${new Date(slot.report.evidence.fetchedAt).toLocaleString()}` : "No survey loaded"}
        </div>
      </div>
      <div>
        <label className="btn-quiet cursor-pointer">
          Load survey JSON
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={async (ev) => {
              const f = ev.target.files?.[0];
              if (!f) return;
              try {
                const parsed = JSON.parse(await f.text());
                if (!isReport(parsed)) return onLoad(null, `${f.name} is not a Crawlspace survey export.`);
                onLoad({ report: parsed, name: f.name });
              } catch {
                onLoad(null, `${f.name} could not be read as JSON.`);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

export function CompareSurveys() {
  const [a, setA] = useState<Slot>(null);
  const [b, setB] = useState<Slot>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const last = readLastReport();
    if (last) setB({ report: last, name: "Survey in this tab" });
  }, []);

  const both = a && b;
  const changes =
    both &&
    b.report.checks
      .map((after) => {
        const before = a.report.checks.find((c) => c.id === after.id);
        if (!before || before.status === "na" || after.status === "na") return null;
        const d = RANK[after.status] - RANK[before.status];
        if (d === 0) return null;
        return { id: after.id, label: after.label, before: before.status, after: after.status, better: d > 0, evidence: after.evidence };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-12">
      <div className="tb-label">Compare</div>
      <h1 className="mt-2 text-[clamp(32px,4.4vw,52px)] leading-[1.02]">Two surveys, side by side.</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Load a survey you exported earlier as the baseline. The survey you ran last in this tab is
        already loaded as the latest. Nothing leaves your browser.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <FilePick label="Baseline (before)" slot={a} onLoad={(s, err) => { setError(err ?? null); if (s) setA(s); }} />
        <FilePick label="Latest (after)" slot={b} onLoad={(s, err) => { setError(err ?? null); if (s) setB(s); }} />
      </div>
      {error && <p role="alert" className="mt-3 text-[13px] text-danger">{error}</p>}

      {both && (
        <div className="mt-10 space-y-8">
          {a.report.evidence.finalUrl !== b.report.evidence.finalUrl && (
            <p className="border-l-2 border-warn pl-3 text-[13px] text-ink-dim">
              These are surveys of different URLs, so differences reflect two pages, not one page over time.
            </p>
          )}

          <section className="plate overflow-hidden">
            <div className="border-b border-line px-5 py-3 tb-label">Engine scores</div>
            <table className="w-full text-[13.5px]">
              <tbody>
                {ENGINES.map((x) => {
                  const s0 = a.report.engines[x].score;
                  const s1 = b.report.engines[x].score;
                  const d = s1 - s0;
                  return (
                    <tr key={x} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-2.5">{ENGINE_LABELS[x]}</td>
                      <td className="num px-3 text-right text-ink-dim">{s0}</td>
                      <td className="num px-3 text-right">{s1}</td>
                      <td className={`num px-5 text-right ${d > 0 ? "text-good" : d < 0 ? "text-danger" : "text-ink-faint"}`}>
                        {d > 0 ? `+${d}` : d}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="plate overflow-hidden">
            <div className="border-b border-line px-5 py-3 tb-label">
              What changed — {changes!.filter((c) => c.better).length} improved, {changes!.filter((c) => !c.better).length} regressed
            </div>
            {changes!.length === 0 ? (
              <p className="px-5 py-4 text-[13.5px] text-ink-dim">No check changed status between these surveys.</p>
            ) : (
              <ul>
                {changes!.map((c) => (
                  <li key={c.id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-line px-5 py-3 last:border-b-0">
                    <div>
                      <div className="text-[14px] text-ink">{c.label}</div>
                      <div className="mono mt-0.5 text-[11px] text-ink-faint">{c.evidence}</div>
                    </div>
                    <div className={`mono text-[11.5px] uppercase ${c.better ? "text-good" : "text-danger"}`}>
                      {c.before} → {c.after}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
