import type { AuditReport, Engine, SavedAuditSummary } from "@/lib/types";

/** The history row for a report. Pure: used by server storage and by guest history. */
export function summarise(id: string, report: AuditReport): SavedAuditSummary {
  const e = report.evidence;
  let host = e.finalUrl;
  try {
    host = new URL(e.finalUrl).host;
  } catch {
    /* keep the raw value */
  }
  const engines = Object.fromEntries(
    Object.entries(report.engines).map(([k, v]) => [k, v.score]),
  ) as Record<Engine, number>;
  return {
    id,
    url: e.finalUrl,
    host,
    title: e.html.title ?? null,
    createdAt: e.fetchedAt ?? new Date().toISOString(),
    composite: report.composite,
    overall: report.visibility.overall,
    engines,
    gated: Object.values(report.engines).filter((x) => x.capped).length,
    findings: report.findings.length,
    critical: report.findings.filter((f) => f.severity === "critical").length,
  };
}

