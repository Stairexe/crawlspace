"use client";

import { useRef, useState } from "react";
import type { AuditReport } from "@/lib/types";
import { ENGINES, ENGINE_LABELS } from "@/lib/types";
import { download } from "@/lib/export";

/**
 * Site mode. The browser asks for a page list (/api/sitemap), then audits the pages
 * itself, three at a time, through the same /api/audit every single-page survey uses.
 * No page is scored differently because it was part of a site survey.
 */
type Row =
  | { url: string; state: "queued" | "running" }
  | { url: string; state: "done"; report: AuditReport }
  | { url: string; state: "error"; error: string };

const CONCURRENCY = 3;

export function SiteSurvey() {
  const [site, setSite] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cancelled = useRef(false);

  async function run() {
    setError(null);
    setRows([]);
    setBusy(true);
    cancelled.current = false;
    try {
      const res = await fetch("/api/sitemap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: site }),
      });
      const plan = await res.json();
      if (!res.ok) throw new Error(plan.error ?? "Could not read that site.");
      setSource(plan.source);
      setTotal(plan.totalFound);
      const list: Row[] = (plan.urls as string[]).map((url) => ({ url, state: "queued" }));
      setRows(list);

      let next = 0;
      const worker = async () => {
        while (!cancelled.current && next < list.length) {
          const i = next++;
          setRows((r) => r.map((x, j) => (j === i ? { url: x.url, state: "running" } : x)));
          try {
            const r = await fetch("/api/audit", {
              method: "POST",
              headers: { "content-type": "application/json", "x-crawlspace-mode": "site" },
              body: JSON.stringify({ url: list[i].url }),
            });
            const json = await r.json();
            if (!r.ok) throw new Error(json.error ?? "Failed");
            setRows((rs) => rs.map((x, j) => (j === i ? { url: x.url, state: "done", report: json as AuditReport } : x)));
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed";
            setRows((rs) => rs.map((x, j) => (j === i ? { url: x.url, state: "error", error: msg } : x)));
          }
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    } catch (e) {
      setError(e instanceof Error ? e.message : "The site survey failed.");
    } finally {
      setBusy(false);
    }
  }

  const done = rows.filter((r): r is Extract<Row, { state: "done" }> => r.state === "done");
  const avg = (engine: (typeof ENGINES)[number]) =>
    done.length ? Math.round(done.reduce((n, r) => n + r.report.engines[engine].score, 0) / done.length) : 0;

  // Defects that repeat across pages are site-level fixes (templates, robots, schema).
  const defectCounts = new Map<string, { summary: string; pages: number }>();
  for (const r of done) {
    for (const f of r.report.findings) {
      const d = defectCounts.get(f.checkId) ?? { summary: f.fix.summary, pages: 0 };
      d.pages++;
      defectCounts.set(f.checkId, d);
    }
  }
  const sitewide = [...defectCounts.entries()]
    .filter(([, d]) => d.pages >= Math.max(2, Math.ceil(done.length * 0.6)))
    .sort((a, b) => b[1].pages - a[1].pages);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-12">
      <div className="tb-label">Site survey</div>
      <h1 className="mt-2 text-[clamp(32px,4.4vw,52px)] leading-[1.02]">Survey a whole site.</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Crawlspace reads the site&apos;s sitemap, picks up to 20 pages across its sections, and
        surveys each one exactly as it would on its own. Defects that repeat on most pages are
        template-level fixes: change one file, fix them everywhere.
      </p>

      <form
        className="title-block plate mt-8 max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy && site.trim()) void run();
        }}
      >
        <div>
          <label htmlFor="site-url" className="tb-label">
            Site to survey
          </label>
          <input
            id="site-url"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="company.com"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            className="mono mt-2 w-full border-0 border-b border-signal/40 bg-transparent pb-2 text-[16px] text-ink outline-none focus:border-signal"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary btn-wide">
            {busy ? `Surveying ${done.length}/${rows.length || "…"}` : "Survey up to 20 pages"} <span aria-hidden>→</span>
          </button>
          {busy && (
            <button type="button" className="btn-quiet" onClick={() => (cancelled.current = true)}>
              Stop
            </button>
          )}
        </div>
      </form>
      {error && <p role="alert" className="mt-3 text-[13.5px] text-danger">{error}</p>}

      {rows.length > 0 && (
        <div className="mt-10 space-y-8">
          <p className="mono text-[11.5px] text-ink-faint">
            {total} pages found via {source}; surveying {rows.length}.
          </p>

          {done.length > 0 && (
            <section className="grid gap-4 md:grid-cols-5">
              {ENGINES.map((x) => (
                <div key={x} className="plate p-4">
                  <div className="tb-label">{ENGINE_LABELS[x]}</div>
                  <div className="num mt-1 text-[26px] text-ink">{avg(x)}</div>
                  <div className="mono text-[10.5px] text-ink-faint">site average, {done.length} pages</div>
                </div>
              ))}
            </section>
          )}

          {sitewide.length > 0 && (
            <section className="plate overflow-hidden">
              <div className="border-b border-line px-5 py-3 tb-label">Site-wide defects — fix once, fix everywhere</div>
              <ul>
                {sitewide.map(([id, d]) => (
                  <li key={id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-line px-5 py-3 last:border-b-0">
                    <div>
                      <div className="text-[14px] text-ink">{d.summary}</div>
                      <div className="mono text-[11px] text-ink-faint">{id}</div>
                    </div>
                    <div className="mono text-[12px] text-ink-dim">
                      {d.pages}/{done.length} pages
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="plate overflow-hidden">
            <div tabIndex={0} role="region" aria-label="Pages surveyed" className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="mono border-b border-line text-left text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
                    <th className="px-4 py-2.5">Page</th>
                    {ENGINES.map((x) => (
                      <th key={x} className="px-2 py-2.5 text-right">
                        {ENGINE_LABELS[x].split(" ")[0]}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-right">Defects</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.url} className="border-b border-line last:border-b-0">
                      <td className="mono max-w-[340px] truncate px-4 py-2.5 text-[12px]" title={r.url}>
                        {new URL(r.url).pathname || "/"}
                      </td>
                      {r.state === "done" ? (
                        <>
                          {ENGINES.map((x) => (
                            <td key={x} className={`num px-2 text-right ${r.report.engines[x].capped ? "text-danger" : ""}`}>
                              {r.report.engines[x].score}
                            </td>
                          ))}
                          <td className="num px-4 text-right">{r.report.findings.length}</td>
                        </>
                      ) : (
                        <td colSpan={ENGINES.length + 1} className="mono px-4 text-[11.5px] text-ink-faint">
                          {r.state === "error" ? r.error : r.state === "running" ? "Surveying…" : "Queued"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {done.length > 0 && !busy && (
            <button
              type="button"
              className="btn-quiet"
              onClick={() =>
                download(
                  `${new URL(rows[0].url).hostname}-site-survey.json`,
                  JSON.stringify(done.map((d) => d.report), null, 2),
                  "application/json",
                )
              }
            >
              Download all {done.length} surveys (JSON)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
