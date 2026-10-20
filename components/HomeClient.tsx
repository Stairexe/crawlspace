"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, ChevronRight, FileSearch, Globe, Layers, ScrollText, GitCompare } from "lucide-react";
import type { AuditReport } from "@/lib/types";
import type { AiState } from "@/components/Blocks";
import { HeroGlobe } from "@/components/HeroGlobe";
import { useSession } from "@/components/useSession";
import { rememberAudit } from "@/components/guestHistory";

// The results view is most of this page's JavaScript and is only needed once an audit
// returns, so it loads then (and is prefetched the moment an audit starts).
const loadDashboard = () => import("@/components/VisibilityDashboard");
const VisibilityDashboard = dynamic(() => loadDashboard().then((m) => m.VisibilityDashboard), {
  ssr: false,
  loading: () => <div className="plate h-64" aria-busy="true" />,
});

type Phase = "idle" | "scanning" | "done" | "error";

const SPECIMENS = [
  { label: "Stripe docs", url: "stripe.com/docs/payments" },
  { label: "Wikipedia", url: "en.wikipedia.org/wiki/Generative_engine_optimization" },
  { label: "Vercel docs", url: "vercel.com/docs" },
  { label: "Linear", url: "linear.app" },
];

const MODES = [
  { id: "audit", label: "Audit", icon: FileSearch, href: null },
  { id: "site", label: "Site", icon: Layers, href: "/site" },
  { id: "logs", label: "Logs", icon: ScrollText, href: "/logs" },
  { id: "compare", label: "Compare", icon: GitCompare, href: "/compare" },
] as const;

const STEPS = [
  "Resolving and fetching the page as a crawler would",
  "Reading robots.txt for 23 AI agents",
  "Checking llms.txt, sitemap and structured data",
  "Measuring every passage for citability",
  "Scoring five engines separately",
];

function hostOf(value: string): string {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).host;
  } catch {
    return value;
  }
}

function Corner({ pos, children }: { pos: string; children: React.ReactNode }) {
  return (
    <span aria-hidden className={`mono pointer-events-none absolute hidden text-[11px] uppercase tracking-wide text-ink-faint/70 sm:block ${pos}`}>
      [ {children} ]
    </span>
  );
}

function Spark({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={`pointer-events-none absolute h-5 w-5 text-signal ${className}`}>
      <path d="M10 0c.6 5.4 4 9 10 10-6 1-9.4 4.6-10 10-.6-5.4-4-9-10-10 6-1 9.4-4.6 10-10Z" fill="currentColor" />
    </svg>
  );
}

/**
 * The landing page's interactive shell: the audit request (hero), and the scanning,
 * error and results states. Everything else on the page is server-rendered and passed
 * in as children, shown only while no audit is on screen.
 */
export function HomeClient({ children }: { children: React.ReactNode }) {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [step, setStep] = useState(0);
  const [ai, setAi] = useState<AiState>({ enabled: false, providers: [], userKey: "", provider: "anthropic" });
  const [keyOpen, setKeyOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const session = useSession();

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
    // ?url= runs straight away (links from other pages and the CLI docs use it).
    const q = new URLSearchParams(window.location.search).get("url");
    if (q) {
      setUrl(q);
      void run(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The step list describes what the engine does, in order. It advances on a timer
  // because the server answers once, at the end; it never claims a step finished.
  useEffect(() => {
    if (phase !== "scanning") return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 650);
    return () => clearInterval(t);
  }, [phase]);

  const run = useCallback(async (value: string) => {
    const v = value.trim();
    if (!v) {
      inputRef.current?.focus();
      return;
    }
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
      if (!res.ok) throw new Error(json.error ?? "The audit failed.");
      const r = json as AuditReport;
      setReport(r);
      setPhase("done");
      rememberAudit(r);
      try {
        // Same key the dashboard restores from, so "Dashboard" in the nav opens this audit.
        sessionStorage.setItem("crawlspace:last-report", JSON.stringify(json));
      } catch {
        /* storage unavailable */
      }
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The audit failed.");
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

  const busy = phase === "scanning";

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section id="top" className="relative scroll-mt-24 border-b border-line">
        <div className="frame relative overflow-hidden">
          <div className="grid-cells absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]" />
          <HeroGlobe className="absolute left-1/2 top-[50%] h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 !opacity-80 sm:h-[860px] sm:w-[860px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,249,249,0.92)_0%,rgba(249,249,249,0.6)_38%,transparent_70%)]" />
          <Corner pos="left-5 top-5">200 OK</Corner>
          <Corner pos="right-5 top-5">GEO audit</Corner>
          <Corner pos="left-5 bottom-5">.json</Corner>
          <Corner pos="right-5 bottom-5">5 engines</Corner>
          <Spark className="left-[16%] top-[84px] hidden md:block" />
          <Spark className="right-[16%] top-[84px] hidden md:block" />

          <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
            <Link
              href="/methodology"
              data-reveal
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] font-medium text-ink shadow-sm transition-colors hover:border-line-bright"
            >
              <span className="rounded-full bg-wash px-1.5 py-px text-[11px] text-signal">Free</span>
              No account, no API key, open source
              <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
            </Link>

            <h1 data-split data-split-now className="mt-7 text-[clamp(34px,7vw,76px)] leading-[1.04]">
              <span className="reveal-line">
                <span>See your site the way</span>
              </span>
              <span className="reveal-line">
                <span className="text-signal">AI engines do</span>
              </span>
            </h1>
            <p data-reveal className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-dim">
              Crawlspace audits any page for ChatGPT, Claude, Perplexity, Copilot and Google AI
              Overviews: crawler access, passage-level citability, and{" "}
              <span className="whitespace-nowrap rounded bg-raised px-1.5 py-0.5 text-ink">five separate scores</span>.
            </p>

            <div data-reveal className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              <button type="button" onClick={() => void run(url)} className="btn-primary" disabled={busy}>
                Start free audit
              </button>
              <Link href={session.user ? "/dashboard" : "/sample"} className="btn-quiet">
                {session.user ? "Open dashboard" : "See a sample report"}
              </Link>
            </div>

            {/* The request card */}
            <form
              data-reveal
              onSubmit={(e) => {
                e.preventDefault();
                void run(url);
              }}
              aria-label="Audit a page"
              className="mt-10 w-full max-w-[560px] rounded-2xl border border-line bg-surface p-2 text-left shadow-[0_1px_1px_rgba(0,0,0,0.03),0_20px_40px_-20px_rgba(0,0,0,0.18)]"
            >
              <label htmlFor="audit-url" className="sr-only">
                Page to audit
              </label>
              <div className="flex items-center gap-2.5 px-3 pb-2 pt-2.5">
                <Globe className="h-4 w-4 shrink-0 text-ink-faint" />
                <input
                  ref={inputRef}
                  id="audit-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.com/pricing"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint/70"
                />
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-line px-1 pt-2">
                <div className="flex min-w-0 items-center gap-1 overflow-x-auto thin-scroll">
                  {MODES.map((m) =>
                    m.href ? (
                      <Link
                        key={m.id}
                        href={m.href}
                        aria-label={m.label}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-faint transition-colors hover:bg-void hover:text-ink"
                      >
                        <m.icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{m.label}</span>
                      </Link>
                    ) : (
                      <span
                        key={m.id}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-void px-2.5 py-1.5 text-[13px] font-medium text-ink"
                      >
                        <m.icon className="h-3.5 w-3.5 text-signal" />
                        {m.label}
                      </span>
                    ),
                  )}
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  aria-label="Run audit"
                  className="btn-primary h-9 w-11 shrink-0 !px-0"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div data-reveal className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[12.5px] text-ink-faint">
              <span className="mr-1">Try</span>
              {SPECIMENS.map((s) => (
                <button
                  key={s.url}
                  type="button"
                  disabled={busy}
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

            {!ai.enabled && (
              <div data-reveal className="mt-5 w-full max-w-[560px] text-left">
                <button
                  type="button"
                  onClick={() => setKeyOpen((v) => !v)}
                  aria-expanded={keyOpen}
                  className="mx-auto flex items-center gap-1.5 text-[12.5px] text-ink-faint hover:text-ink"
                >
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${keyOpen ? "rotate-90" : ""}`} />
                  {ai.userKey ? "Rewrite key set for this tab" : "Optional: add a key to rewrite weak passages"}
                </button>
                {keyOpen && (
                  <div className="mt-3 space-y-2 rounded-xl border border-line bg-surface p-3 spawn">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={ai.provider}
                        onChange={(e) => setAi((s) => ({ ...s, provider: e.target.value as AiState["provider"] }))}
                        aria-label="Provider"
                        className="field !h-9 !w-auto !text-[13px]"
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
                        className="field mono !h-9 flex-1 !text-[13px]"
                      />
                    </div>
                    <p className="text-[12px] leading-relaxed text-ink-faint">
                      Only needed to rewrite passages. Kept in this browser tab, sent only with rewrite
                      requests, never stored.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── In progress ──────────────────────────────────────────────────── */}
      {phase === "scanning" && (
        <section aria-live="polite" className="frame border-b border-line px-5 py-14">
          <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="bracket">
                  [ <b>auditing</b> ]
                </div>
                <div className="mono mt-1 truncate text-[15px] text-ink">{hostOf(target)}</div>
              </div>
              <span className="mono text-[12px] text-ink-faint">usually 1–5s</span>
            </div>
            <div className="relative mt-5 h-[3px] overflow-hidden rounded-full bg-line sweep" />
            <ol className="mt-5 space-y-2">
              {STEPS.map((s, n) => (
                <li
                  key={s}
                  className={`flex items-center gap-3 text-[13.5px] transition-colors ${n <= step ? "text-ink" : "text-ink-faint/60"}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${n === step ? "bg-signal pulse-dot" : n < step ? "bg-ink" : "bg-line-bright"}`} />
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {phase === "error" && error && (
        <section className="frame border-b border-line px-5 py-12">
          <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-danger/30 bg-surface p-6">
            <div className="bracket !text-danger">[ audit not completed ]</div>
            <p className="mt-2 text-[15px] text-ink">{error}</p>
            <button type="button" onClick={() => setPhase("idle")} className="btn-quiet mt-4">
              Try another page
            </button>
          </div>
        </section>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {phase === "done" && report && (
        <div ref={resultsRef} className="frame scroll-mt-20 border-b border-line px-4 py-10 sm:px-8">
          {report.savedId ? (
            <p className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-[13.5px] text-ink-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-good" /> Saved to your history.
              <Link href="/dashboard?tab=history" className="link-accent">
                Open history <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          ) : !session.user && session.accounts ? (
            <p className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-[13.5px] text-ink-dim">
              Kept in this browser only.
              <Link href="/signup" className="link-accent">
                Create a free account to save audits and share them <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          ) : null}
          <VisibilityDashboard
            report={report}
            ai={ai}
            onReset={() => {
              setPhase("idle");
              setReport(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}

      {(phase === "idle" || phase === "error") && children}
    </>
  );
}
