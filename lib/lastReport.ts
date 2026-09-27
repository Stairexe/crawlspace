import type { AuditReport } from "./types";

/** The last survey of this browser tab. Shared by home, dashboard, print and compare. */
export const LAST_REPORT_KEY = "crawlspace:last-report";

export function readLastReport(): AuditReport | null {
  try {
    const raw = sessionStorage.getItem(LAST_REPORT_KEY);
    return raw ? (JSON.parse(raw) as AuditReport) : null;
  } catch {
    return null;
  }
}

/** Loose check that a parsed file is a Crawlspace survey export. */
export function isReport(x: unknown): x is AuditReport {
  const r = x as Partial<AuditReport> | null;
  return !!r && typeof r === "object" && !!r.evidence && !!r.engines && Array.isArray(r.checks);
}
