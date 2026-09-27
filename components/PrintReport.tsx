"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { AuditReport } from "@/lib/types";
import { ENGINES, ENGINE_LABELS, CATEGORY_LABELS } from "@/lib/types";
import { readLastReport } from "@/lib/lastReport";

/**
 * The whole survey on paper: every section at once, laid out for A4/Letter, opened with
 * the browser's print dialog so "Save as PDF" produces the file. Reads the survey from
 * this tab's storage — nothing is uploaded to make the PDF.
 */
/** Prints the survey in this tab without leaving the page: mounts the paper layout at the
 *  top of <body>, hides everything else for the print, and cleans up afterwards. */
export function PrintButton({ report, className }: { report: AuditReport; className?: string }) {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    if (!printing) return;
    document.body.classList.add("printing");
    const done = () => {
      document.body.classList.remove("printing");
      setPrinting(false);
    };
    window.addEventListener("afterprint", done, { once: true });
    const t = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("afterprint", done);
      document.body.classList.remove("printing");
    };
  }, [printing]);
  return (
    <>
      <button type="button" className={className} onClick={() => setPrinting(true)}>
        Save as PDF
      </button>
      {printing && createPortal(<div className="print-root"><PaperReport report={report} /></div>, document.body)}
    </>
  );
}

export function PrintReport() {
  const [report, setReport] = useState<AuditReport | null | undefined>(undefined);

  useEffect(() => {
    const r = readLastReport();
    setReport(r);
    if (r) {
      const t = window.setTimeout(() => window.print(), 600);
      return () => window.clearTimeout(t);
    }
  }, []);

  if (report === undefined) return null;
  if (!report) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24">
        <div className="tb-label">Nothing to print</div>
        <h1 className="mt-3 text-[26px]">Run a survey first.</h1>
        <p className="mt-3 text-[14.5px] text-ink-dim">
          The PDF is made from the last survey in this browser tab.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Run a survey
        </Link>
      </div>
    );
  }

  return <PaperReport report={report} />;
}

function PaperReport({ report }: { report: AuditReport }) {
  const e = report.evidence;
  return (
    <article className="print-sheet mx-auto max-w-[820px] bg-surface px-10 py-10 text-ink">
      <header className="border-b-[3px] border-double border-signal pb-5">
        <div className="tb-label">Crawlspace — structural survey</div>
        <h1 className="mt-2 text-[28px] leading-tight">{e.html.title || new URL(e.finalUrl).hostname}</h1>
        <div className="mono mt-2 text-[11.5px] text-ink-dim">
          {e.finalUrl} · inspected {new Date(e.fetchedAt).toUTCString()} · model v{report.version}
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-[16px]">Engine scores</h2>
        <table className="mt-2 w-full text-[12.5px]">
          <tbody>
            {ENGINES.map((x) => (
              <tr key={x} className="border-b border-line">
                <td className="py-1.5">{ENGINE_LABELS[x]}</td>
                <td className="num py-1.5 text-right">{report.engines[x].score}</td>
                <td className="py-1.5 pl-4 text-ink-faint">{report.engines[x].capped ? "not inspected (gated)" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">{report.summary}</p>
      </section>

      {report.plan && report.plan.steps.length > 0 && (
        <section className="mt-6 break-inside-avoid">
          <h2 className="text-[16px]">
            Fix first — {report.plan.from} → {report.plan.to}
          </h2>
          <ol className="mt-2 space-y-1 text-[12.5px]">
            {report.plan.steps.map((s, i) => (
              <li key={s.checkId}>
                {i + 1}. {s.summary} <span className="text-ink-faint">({s.effort}, +{s.gain} → {s.after})</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] text-ink-faint">
            Projection of Crawlspace&apos;s own scoring with each fix done completely; not a citation forecast.
          </p>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-[16px]">Defect schedule ({report.findings.length})</h2>
        <ol className="mt-2 space-y-3">
          {report.findings.map((f, i) => (
            <li key={f.checkId} className="break-inside-avoid border-b border-line pb-2 text-[12.5px]">
              <div className="flex justify-between gap-4">
                <strong>
                  {i + 1}. {f.fix.summary}
                </strong>
                <span className="mono uppercase text-ink-faint">{f.severity}</span>
              </div>
              <div className="mono mt-0.5 text-[11px] text-ink-faint">
                {f.checkId} · {CATEGORY_LABELS[f.category]} · {f.effort} effort
              </div>
              <div className="mt-1 text-ink-dim">Evidence: {f.evidence}</div>
              <div className="mt-1 text-ink-dim">{f.fix.detail}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 break-inside-avoid">
        <h2 className="text-[16px]">All checks</h2>
        <table className="mt-2 w-full text-[11.5px]">
          <tbody>
            {report.checks.map((c) => (
              <tr key={c.id} className="border-b border-line align-top">
                <td className="py-1 pr-2">{c.label}</td>
                <td className="mono py-1 pr-2 uppercase">{c.status === "na" ? "n/a" : c.status}</td>
                <td className="py-1 text-ink-dim">{c.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-8 border-t border-line pt-3 text-[10.5px] text-ink-faint">
        Scores model how citable a page is; they do not measure whether it is cited. Methodology:
        crawlspace-geo.vercel.app/methodology
      </footer>
    </article>
  );
}
