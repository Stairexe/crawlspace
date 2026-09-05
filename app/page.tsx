"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuditReport } from "@/lib/types";
import { ScoreBoard } from "@/components/ScoreBoard";
import { Findings } from "@/components/Findings";
import { WeakBlocks, type AiState } from "@/components/Blocks";
import { Generated } from "@/components/Generated";
import { download, reportToMarkdown, safeFilename } from "@/lib/export";

type Phase = "idle" | "scanning" | "done" | "error";

const STEPS = [
  "fetching the page as a crawler sees it",
  "resolving robots.txt against 12 AI user agents",
  "segmenting the page into content blocks",
  "scoring every block for extractability",
  "applying five engine weight vectors",
];

const EXAMPLES = [
  "stripe.com/docs/payments",
  "en.wikipedia.org/wiki/Generative_engine_optimization",
  "vercel.com/docs",
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [ai, setAi] = useState<AiState>({
    enabled: false,
    providers: [],
    userKey: "",
    provider: "anthropic",
  });
  const [keyOpen, setKeyOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/rewrite")
      .then((r) => r.json())
      .then((d: { enabled: boolean; providers: string[]; default: string | null }) =>
        setAi((s) => ({
          ...s,
          enabled: d.enabled,
          providers: d.providers,
          provider: (d.default as AiState["provider"]) ?? s.provider,
        })),
      )
      .catch(() => undefined);
    try {
      const saved = sessionStorage.getItem("crawlspace:key");
      if (saved) setAi((s) => ({ ...s, userKey: saved }));
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    if (phase !== "scanning") return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1100);
    return () => clearInterval(t);
  }, [phase]);

  const run = useCallback(
    async (target: string) => {
      const value = target.trim();
      if (!value) return;
      setPhase("scanning");
      setError(null);
      setReport(null);
      try {
        const res = await fetch("/api/audit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: value }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "The audit failed.");
        setReport(json as AuditReport);
        setPhase("done");
        setTimeout(
          () => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
          80,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "The audit failed.");
        setPhase("error");
      }
    },
    [],
  );

  function saveKey(value: string) {
    setAi((s) => ({ ...s, userKey: value }));
    try {
      if (value) sessionStorage.setItem("crawlspace:key", value);
      else sessionStorage.removeItem("crawlspace:key");
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="pt-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mono mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] text-ink-dim">
            <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-signal pulse-dot" />
            generative engine optimisation
          </div>
          <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[46px]">
            Ranking got you traffic.
            <br />
            <span className="text-ink-faint">Being quotable gets you cited.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-dim">
            Crawlspace reads a page the way ChatGPT, Perplexity, Claude, Copilot and Google AI
            Overviews read it — then tells you, per engine, which paragraphs they can lift and
            which ones they will skip.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(url);
          }}
          className="mx-auto mt-9 max-w-2xl"
        >
          <div className="relative flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yoursite.com/the-page-you-care-about"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                aria-label="URL to audit"
                className="mono h-12 w-full rounded-lg border border-line bg-surface px-4 text-[13.5px] text-ink placeholder:text-ink-faint/60 transition-colors focus:border-line-bright"
              />
            </div>
            <button
              type="submit"
              disabled={phase === "scanning"}
              className="mono h-12 shrink-0 rounded-lg bg-signal px-7 text-[13px] font-semibold text-void transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-55"
            >
              {phase === "scanning" ? "auditing…" : "run audit"}
            </button>
          </div>

          <div className="mono mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-ink-faint">
            <span>try</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setUrl(ex);
                  void run(ex);
                }}
                className="rounded border border-line px-2 py-0.5 transition-colors hover:border-line-bright hover:text-ink-dim"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>

        {/* Model key — the tool is fully useful without one. */}
        <div className="mx-auto mt-5 max-w-2xl">
          {!ai.enabled && (
            <div className="rounded-lg border border-line bg-surface/60 px-4 py-3">
              <button
                type="button"
                onClick={() => setKeyOpen((v) => !v)}
                className="flex w-full items-center gap-2 text-left"
              >
                <span className="mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
                  rewrite layer
                </span>
                <span className="text-[12.5px] text-ink-dim">
                  {ai.userKey
                    ? "key set for this session"
                    : "the audit runs without a key — add one to rewrite passages"}
                </span>
                <span
                  aria-hidden
                  className="mono ml-auto text-[11px] text-ink-faint transition-transform"
                  style={{ transform: keyOpen ? "rotate(90deg)" : "none" }}
                >
                  ›
                </span>
              </button>
              {keyOpen && (
                <div className="mt-3 space-y-2.5 border-t border-line pt-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={ai.provider}
                      onChange={(e) =>
                        setAi((s) => ({ ...s, provider: e.target.value as AiState["provider"] }))
                      }
                      className="mono h-9 rounded-md border border-line bg-base px-2.5 text-[12px] text-ink-dim"
                    >
                      <option value="anthropic">Anthropic</option>
                      <option value="openai">OpenAI</option>
                    </select>
                    <input
                      type="password"
                      value={ai.userKey}
                      onChange={(e) => saveKey(e.target.value)}
                      placeholder={ai.provider === "anthropic" ? "sk-ant-…" : "sk-…"}
                      autoComplete="off"
                      aria-label="API key"
                      className="mono h-9 flex-1 rounded-md border border-line bg-base px-3 text-[12px] text-ink placeholder:text-ink-faint/70"
                    />
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-ink-faint">
                    Held in this browser tab only, sent with the rewrite request, never stored on
                    the server and never logged. Clearing the field removes it.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Scanning ───────────────────────────────────────────────────────── */}
      {phase === "scanning" && (
        <section className="mx-auto mt-14 max-w-lg">
          <div className="card overflow-hidden p-5">
            <div className="relative mb-5 h-[2px] overflow-hidden rounded-full bg-line sweep" />
            <ul className="space-y-2.5">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className="mono flex items-center gap-2.5 text-[12px] transition-colors"
                  style={{ color: i <= step ? "var(--color-ink-dim)" : "var(--color-ink-faint)" }}
                >
                  <span
                    aria-hidden
                    className={`block h-1.5 w-1.5 rounded-full ${i === step ? "bg-signal pulse-dot" : i < step ? "bg-signal" : "bg-line-bright"}`}
                  />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {phase === "error" && error && (
        <section className="mx-auto mt-12 max-w-2xl">
          <div className="card rise border-danger/30 p-5">
            <div className="mono mb-2 text-[11px] uppercase tracking-[0.14em] text-danger">
              audit stopped
            </div>
            <p className="text-[14px] leading-relaxed text-ink-dim">{error}</p>
          </div>
        </section>
      )}

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {phase === "done" && report && (
        <div ref={resultsRef} className="mt-14 space-y-10 scroll-mt-20">
          <ScoreBoard report={report} />
          <Findings findings={report.findings} />
          <WeakBlocks report={report} ai={ai} />
          <Generated report={report} />

          <section className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <span className="mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              export
            </span>
            <button
              type="button"
              onClick={() =>
                download(
                  `crawlspace-${safeFilename(report.evidence.finalUrl)}.md`,
                  reportToMarkdown(report),
                  "text/markdown",
                )
              }
              className="mono rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-dim transition-colors hover:border-line-bright hover:text-ink"
            >
              markdown report
            </button>
            <button
              type="button"
              onClick={() =>
                download(
                  `crawlspace-${safeFilename(report.evidence.finalUrl)}.json`,
                  JSON.stringify(report, null, 2),
                  "application/json",
                )
              }
              className="mono rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-dim transition-colors hover:border-line-bright hover:text-ink"
            >
              raw json
            </button>
            <span className="mono ml-auto text-[11px] text-ink-faint">
              nothing is stored — this report exists only in this tab
            </span>
          </section>
        </div>
      )}

      {/* ── How it works (idle only) ───────────────────────────────────────── */}
      {phase === "idle" && (
        <section className="mt-24 border-t border-line pt-14">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                n: "01",
                h: "One evidence pass, five verdicts",
                p: "The page is fetched once. The same evidence then runs through five different weight vectors, because the engines genuinely disagree — Google says AI files and chunked content are not required, while Perplexity rewards both. A single blended score would average that away.",
              },
              {
                n: "02",
                h: "Blocked crawlers are a gate, not a deduction",
                p: "If robots.txt shuts out every agent an engine uses, that engine cannot cite you at all — so its score is capped rather than averaged. The report leads with the access problem instead of burying it under schema advice.",
              },
              {
                n: "03",
                h: "The rewrite is re-scored, not promised",
                p: "Rewritten passages go back through the same block scorer, so the improvement you see is measured. The rewriter is forbidden from inventing a statistic, source or quote the page did not already contain.",
              },
            ].map((c) => (
              <div key={c.n}>
                <div className="mono text-[11px] text-signal">{c.n}</div>
                <h3 className="mt-2.5 text-[15px] font-semibold tracking-tight">{c.h}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">{c.p}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
