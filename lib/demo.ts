import type { AuditReport } from "./types";
import { gatherEvidence } from "./extract";
import { runChecks, scoreReport } from "./scoring/score";

/**
 * The specimen audit shown on the landing page.
 *
 * This runs the real engine against a real URL at request time (ISR-cached), because
 * the product's entire claim is that it only reports what it measured. The previous
 * landing page displayed invented scores inside a fake browser chrome; a tool that sells
 * honesty about measurement cannot fabricate its own demo. If the number is unflattering,
 * that is the number.
 */
export const SPECIMEN_URL = "https://stripe.com/docs/payments";

export interface Specimen {
  ok: boolean;
  url: string;
  report?: AuditReport;
  /** Present when the live fetch failed — the UI says so rather than inventing a result. */
  reason?: string;
}

export async function getSpecimen(): Promise<Specimen> {
  try {
    const evidence = await gatherEvidence(SPECIMEN_URL);
    if (evidence.status < 200 || evidence.status >= 300) {
      return {
        ok: false,
        url: SPECIMEN_URL,
        reason: `The specimen page answered HTTP ${evidence.status} when this page was built.`,
      };
    }
    const report = scoreReport(evidence, runChecks(evidence));
    return { ok: true, url: SPECIMEN_URL, report };
  } catch {
    return {
      ok: false,
      url: SPECIMEN_URL,
      reason: "The specimen page could not be reached when this page was built.",
    };
  }
}
