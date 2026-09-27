import type { AuditReport } from "./types";
import { ENGINES, ENGINE_LABELS } from "./types";

/**
 * A compact, machine-friendly view of a survey — used by the MCP tool and the CLI so an
 * agent or a CI log gets the decision-relevant part, not the whole evidence dump.
 */
export function compactReport(r: AuditReport) {
  return {
    url: r.evidence.finalUrl,
    inspectedAt: r.evidence.fetchedAt,
    composite: r.composite,
    engines: Object.fromEntries(
      ENGINES.map((e) => [e, { label: ENGINE_LABELS[e], score: r.engines[e].score, gated: r.engines[e].capped, reason: r.engines[e].capReason ?? null }]),
    ),
    summary: r.summary,
    fixFirst: r.plan?.steps.map((s) => ({ check: s.checkId, fix: s.summary, effort: s.effort, gain: s.gain, scoreAfter: s.after })) ?? [],
    findings: r.findings.map((f) => ({
      check: f.checkId,
      severity: f.severity,
      effort: f.effort,
      fix: f.fix.summary,
      evidence: f.evidence,
    })),
    weakestPassages: r.weakestBlocks.slice(0, 3).map((b) => ({ score: Math.round(b.scores.total * 100), words: b.words, text: b.text.slice(0, 400) })),
    methodology: "https://crawlspace-geo.vercel.app/methodology",
    note: "Scores model how citable the page is; they do not measure whether it is cited.",
  };
}
