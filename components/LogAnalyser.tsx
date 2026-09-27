"use client";

import { useState } from "react";
import { addLine, newSummary, type LogSummary } from "@/lib/logs";
import { ENGINE_LABELS, type Engine } from "@/lib/types";

/**
 * Streams a log file line by line in the browser. The file never leaves the machine.
 */
function engineLabel(e: Engine | "training" | "other"): string {
  if (e === "training") return "training";
  if (e === "other") return "other assistant";
  return ENGINE_LABELS[e];
}

export function LogAnalyser() {
  const [sum, setSum] = useState<LogSummary | null>(null);
  const [name, setName] = useState<string>("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyse(file: File) {
    setError(null);
    setName(file.name);
    setSum(null);
    const s = newSummary();
    try {
      const reader = file.stream().getReader();
      const decoder = new TextDecoder();
      let carry = "";
      let read = 0;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        read += value.byteLength;
        const text = carry + decoder.decode(value, { stream: true });
        const lines = text.split(/\r?\n/);
        carry = lines.pop() ?? "";
        for (const l of lines) addLine(s, l);
        setProgress(Math.round((read / file.size) * 100));
      }
      if (carry) addLine(s, carry);
      setSum(s);
    } catch {
      setError("That file could not be read as text.");
    } finally {
      setProgress(null);
    }
  }

  const agents = sum ? [...sum.agents.values()].sort((a, b) => b.hits - a.hits) : [];
  const citationAgents = agents.filter((a) => a.spec.engine !== "training" && a.spec.engine !== "other");

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-12">
      <div className="tb-label">Crawler log analyser</div>
      <h1 className="mt-2 text-[clamp(32px,4.4vw,52px)] leading-[1.02]">Which AI crawlers actually visit?</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        robots.txt says who is allowed. Your access log says who came. Drop a log file (nginx,
        Apache, or JSON-lines exports) and Crawlspace counts every request from the 23 AI
        crawlers it knows, the pages they fetched and the status they got. The file is read
        in your browser and never uploaded.
      </p>

      <label className="plate mt-8 flex cursor-pointer flex-col items-center justify-center gap-2 border-dashed px-6 py-10 text-center">
        <span className="text-[15px] font-semibold text-ink">{name ? `Loaded: ${name}` : "Choose an access log"}</span>
        <span className="mono text-[11.5px] text-ink-faint">
          {progress !== null ? `Reading… ${progress}%` : ".log, .txt, .json, .jsonl, .csv — any size"}
        </span>
        <input
          type="file"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void analyse(f);
          }}
        />
      </label>
      {error && <p role="alert" className="mt-3 text-[13px] text-danger">{error}</p>}

      {sum && (
        <div className="mt-10 space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Lines read", sum.lines.toLocaleString("en-US")],
              ["AI crawler requests", sum.matched.toLocaleString("en-US")],
              ["Citation crawlers seen", `${citationAgents.length} of 8`],
            ].map(([k, v]) => (
              <div key={k} className="plate p-4">
                <div className="tb-label">{k}</div>
                <div className="num mt-1 text-[24px] text-ink">{v}</div>
              </div>
            ))}
          </div>

          {agents.length === 0 ? (
            <p className="text-[14px] text-ink-dim">
              No request in this file came from a known AI crawler. Either none visited in this
              period, or the log does not record user agents.
            </p>
          ) : (
            <section className="plate overflow-hidden">
              <div tabIndex={0} role="region" aria-label="AI crawler hits" className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="mono border-b border-line text-left text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
                      <th className="px-4 py-2.5">Crawler</th>
                      <th className="px-3 py-2.5">For</th>
                      <th className="px-3 py-2.5 text-right">Requests</th>
                      <th className="px-3 py-2.5">Status codes</th>
                      <th className="px-4 py-2.5">Most fetched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((a) => {
                      const top = [...a.paths.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3);
                      const statuses = [...a.statuses.entries()].sort((x, y) => y[1] - x[1]);
                      const errors = statuses.filter(([s]) => /^[45]/.test(s)).reduce((n, [, c]) => n + c, 0);
                      return (
                        <tr key={a.spec.agent} className="border-b border-line align-top last:border-b-0">
                          <td className="px-4 py-3">
                            <div className="mono font-semibold text-ink">{a.spec.agent}</div>
                            <div className="text-[11.5px] text-ink-faint">{a.spec.operator}</div>
                          </td>
                          <td className="px-3 py-3 text-ink-dim">{engineLabel(a.spec.engine)}</td>
                          <td className="num px-3 py-3 text-right">{a.hits.toLocaleString("en-US")}</td>
                          <td className="mono px-3 py-3 text-[11.5px]">
                            {statuses.slice(0, 4).map(([s, c]) => `${s}×${c}`).join("  ")}
                            {errors > 0 && <div className="text-danger">{errors} errors</div>}
                          </td>
                          <td className="mono px-4 py-3 text-[11.5px] text-ink-dim">
                            {top.map(([p, c]) => (
                              <div key={p} className="max-w-[280px] truncate" title={p}>
                                {p} <span className="text-ink-faint">×{c}</span>
                              </div>
                            ))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <p className="text-[12.5px] leading-relaxed text-ink-faint">
            User agents can be faked. These counts are what requesters claimed to be; confirming a
            hit is genuine needs the operator&apos;s published IP ranges or a reverse-DNS lookup.
          </p>
        </div>
      )}
    </div>
  );
}
