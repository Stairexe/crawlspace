"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuditReport } from "@/lib/types";
import dynamic from "next/dynamic";
import type { AiState } from "@/components/Blocks";
import { CrawlBot } from "@/components/CrawlBot";

// The results view is most of this page's JavaScript and is only needed once a survey
// returns, so it loads then (and is prefetched the moment a survey starts).
const loadDashboard = () => import("@/components/VisibilityDashboard");
const VisibilityDashboard = dynamic(() => loadDashboard().then((m) => m.VisibilityDashboard), {
  ssr: false,
  loading: () => <div className="plate h-64" aria-busy="true" />,
});

type Phase = "idle" | "scanning" | "done" | "error";
type Style = React.CSSProperties & { ["--i"]?: number };
const i = (n: number): Style => ({ ["--i"]: n });

const SPECIMENS = [
  { label: "Stripe docs", url: "stripe.com/docs/payments" },
  { label: "Wikipedia", url: "en.wikipedia.org/wiki/Generative_engine_optimization" },
  { label: "Vercel docs", url: "vercel.com/docs" },
  { label: "Linear", url: "linear.app" },
];

const HEADLINE = ["Can an AI", "assistant", "quote this", "page?"];

function hostOf(value: string): string {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).host;
  } catch {
    return value;
  }
}

/**
 * The landing page's interactive shell: the survey request (hero), and the scanning,
 * error and results states. Everything else on the page is server-rendered and passed
 * in as children, shown only while no survey is on screen.
 */
export function HomeClient({ children }: { children: React.ReactNode }) {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [ai, setAi] = useState<AiState>({ enabled: false, providers: [], userKey: "", provider: "anthropic" });
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

  const run = useCallback(async (value: string) => {
    const v = value.trim();
    if (!v) return;
    setTarget(v);
    setPhase("scanning");
    void loadDashboard();
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: v }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "The survey failed.");
      setReport(json as AuditReport);
      setPhase("done");
      try {
        // Same key the dashboard restores from, so "Dashboard" in the nav opens this survey.
        sessionStorage.setItem("crawlspace:last-report", JSON.stringify(json));
      } catch {
        /* storage unavailable */
      }
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The survey failed.");
      setPhase("error");
    }
  }, []);

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
    <div className="mx-auto max-w-6xl px-5 pb-28">
      {/* ── Hero: the survey request ─────────────────────────────────────── */}
      <section className="pt-8 sm:pt-12">
        <div
          className="after-descent mono flex items-baseline justify-between gap-6 border-b border-line pb-3 text-[10.5px] uppercase tracking-[0.14em] text-ink-faint"
          style={i(0)}
        >
          <span>Structural survey — AI citability</span>
          <span className="hidden text-right lg:inline">ChatGPT · Claude · Perplexity · Copilot · Google AI Overviews</span>
        </div>

        <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <h1 className="text-[clamp(46px,7.4vw,96px)] leading-[0.94]">
              {HEADLINE.map((line, n) => (
                <span key={line} className="reveal-line">
                  <span style={i(n)} className={n === HEADLINE.length - 1 ? "text-signal" : undefined}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <p className="after-descent mt-7 max-w-xl text-[17px] leading-relaxed text-ink-dim" style={i(3)}>
              Crawlspace is a survey of one page as AI crawlers receive it. It measures every passage
              against what each engine can lift, and issues five separate scores with a numbered
              defect schedule.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(url);
            }}
            className="after-descent title-block plate self-start lg:col-span-5 lg:mt-3"
            style={i(4)}
            aria-label="Request a survey"
          >
            <div>
              <label htmlFor="survey-url" className="tb-label">
                Page to survey
              </label>
              <input
                id="survey-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="company.com/pricing"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                className="mono mt-2 w-full border-0 border-b border-signal/40 bg-transparent pb-2 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-faint/70 focus:border-signal"
              />
            </div>
            <div className="tb-split">
              <div>
                <div className="tb-label">Inspected for</div>
                <div className="tb-value">Five engines, scored apart</div>
              </div>
              <div>
                <div className="tb-label">Required</div>
                <div className="tb-value">Nothing. No account, no key</div>
              </div>
            </div>
            <div>
              <button type="submit" disabled={phase === "scanning"} className="btn-primary btn-wide">
                {phase === "scanning" ? "Surveying…" : "Run survey"}
                <span aria-hidden>→</span>
              </button>
            </div>
            <div>
              <div className="tb-label">Or survey a specimen</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SPECIMENS.map((s) => (
                  <button
                    key={s.url}
                    type="button"
                    disabled={phase === "scanning"}
                    onClick={() => {
                      setUrl(s.url);
                      void run(s.url);
                    }}
                    className="chip"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {!ai.enabled && (
              <div>
                <button
                  type="button"
                  onClick={() => setKeyOpen((v) => !v)}
                  aria-expanded={keyOpen}
                  className="flex w-full items-baseline justify-between gap-3 text-left"
                >
                  <span className="tb-label">Rewrite key — optional</span>
                  <span className="mono text-[11px] text-ink-dim">
                    {ai.userKey ? "Key set for this tab" : keyOpen ? "Hide" : "Add"}
                  </span>
                </button>
                {keyOpen && (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={ai.provider}
                        onChange={(e) => setAi((s) => ({ ...s, provider: e.target.value as AiState["provider"] }))}
                        aria-label="Provider"
                        className="mono h-9 rounded-[3px] border border-line bg-void px-2 text-[12px] text-ink"
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
                        className="mono h-9 flex-1 rounded-[3px] border border-line bg-void px-3 text-[12px] text-ink placeholder:text-ink-faint/70"
                      />
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-ink-faint">
                      Only needed to rewrite passages. Kept in this browser tab, sent only with rewrite
                      requests, never stored.
                    </p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {phase === "error" && error && (
        <div role="alert" className="mx-auto mt-12 max-w-2xl border border-danger bg-surface p-5">
          <div className="tb-label text-danger">Survey not completed</div>
          <p className="mt-2 text-[14.5px] text-ink">{error}</p>
          <button type="button" onClick={() => setPhase("idle")} className="btn-quiet mt-4">
            Try another page
          </button>
        </div>
      )}

      {/* ── In progress: honest, not a fake step ticker ──────────────────── */}
      {phase === "scanning" && (
        <section aria-live="polite" className="mx-auto mt-14 max-w-xl">
          <div className="plate p-6">
            <div className="flex items-center gap-4">
              <CrawlBot detail="full" size={64} lensLit className="shrink-0 text-signal" />
              <div className="min-w-0">
                <div className="tb-label">Survey in progress</div>
                <div className="mono mt-1 truncate text-[14px] text-ink">{hostOf(target)}</div>
              </div>
            </div>
            <div className="relative mt-5 h-[2px] overflow-hidden bg-line sweep" />
            <p className="mt-4 text-[13.5px] leading-relaxed text-ink-dim">
              Fetching the page as served, reading robots.txt for five crawlers, then measuring
              every block. Most pages take a few seconds; slow servers take longer.
            </p>
          </div>
        </section>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {phase === "done" && report && (
        <div ref={resultsRef} className="mt-12 scroll-mt-20">
          <VisibilityDashboard
            report={report}
            ai={ai}
            onReset={() => {
              setPhase("idle");
              setReport(null);
            }}
          />
        </div>
      )}

      {(phase === "idle" || phase === "error") && <div className="mt-28 sm:mt-36">{children}</div>}
    </div>
  );
}
