"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AuditReport } from "@/lib/types";
import { VisibilityDashboard } from "@/components/VisibilityDashboard";
import type { AiState } from "@/components/Blocks";
import { FAQ } from "@/lib/faq";
import {
  CheckCircle2,
  Bot,
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Search,
  Code2,
  FileText,
  Cpu,
  Globe,
  Gauge,
  HelpCircle,
  ExternalLink,
  KeyRound,
} from "lucide-react";

type Phase = "idle" | "scanning" | "done" | "error";

const STEPS = [
  "fetching the webpage as a crawler sees it",
  "inspecting robots.txt & separating search from training agents",
  "analyzing on-page SEO, OpenGraph, Twitter, and canonical tags",
  "parsing Schema.org JSON-LD and validating entity properties",
  "segmenting content blocks and evaluating deixis & extractability",
  "computing 5-engine citability and overall visibility score",
];

const EXAMPLES = [
  { label: "Stripe Docs", url: "stripe.com/docs/payments", desc: "Fintech documentation benchmark" },
  { label: "Linear App", url: "linear.app", desc: "Modern developer tool homepage" },
  { label: "Wikipedia GEO", url: "en.wikipedia.org/wiki/Generative_engine_optimization", desc: "Encyclopedic content structure" },
  { label: "Vercel Docs", url: "vercel.com/docs", desc: "Framework and cloud deployment" },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  // Landing page interactive preview state
  const [previewTab, setPreviewTab] = useState<
    "overview" | "seo" | "geo" | "crawlers" | "robots" | "schema" | "content"
  >("overview");
  const [interactiveCrawlerView, setInteractiveCrawlerView] = useState<"search" | "training">("search");
  const [interactiveRewriteToggled, setInteractiveRewriteToggled] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1000);
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
    <div className="mx-auto max-w-6xl px-5 pb-28">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="pt-12 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mono mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-1 text-[11.5px] text-ink-dim glass-panel spawn spawn-1">
            <span aria-hidden className="block h-2 w-2 rounded-full bg-signal pulse-dot" />
            website visibility intelligence
          </div>

          <h1 className="apple-heading text-[38px] font-bold leading-[1.08] tracking-[-0.035em] sm:text-[58px] text-ink spawn spawn-2">
            See how ready your website is for{" "}
            <span className="text-signal">search and AI.</span>
          </h1>

          <p className="apple-body mx-auto mt-5 max-w-2xl text-[16.5px] leading-relaxed text-ink-dim font-medium spawn spawn-3">
            Audit your search fundamentals, AI citation readiness across 5 major engines, robots
            crawler permissions, and structured data from one unified command center.
          </p>
        </div>

        {/* Search Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(url);
          }}
          className="mx-auto mt-8 max-w-2xl spawn spawn-4"
        >
          <div className="relative flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://company.com/the-page-you-care-about"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                aria-label="URL to audit"
                className="mono h-13 w-full rounded-xl border border-line bg-surface px-4 text-[14px] text-ink placeholder:text-ink-faint/60 transition-all focus:border-signal focus:shadow-[0_0_20px_var(--color-signal-glow)]"
              />
            </div>
            <button
              type="submit"
              disabled={phase === "scanning"}
              className="mono h-13 shrink-0 rounded-xl bg-signal px-7 text-[13.5px] font-bold text-void transition-all hover:brightness-110 shadow-[0_0_20px_var(--color-signal-glow)] disabled:cursor-wait disabled:opacity-50"
            >
              {phase === "scanning" ? "Analyzing…" : "Analyze Website →"}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="mono mt-3.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11.5px] text-ink-faint">
            <span>try sample:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.url}
                type="button"
                onClick={() => {
                  setUrl(ex.url);
                  void run(ex.url);
                }}
                className="rounded-md border border-line bg-surface/40 px-2 py-0.5 transition-colors hover:border-line-bright hover:text-ink"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </form>

        {/* API Key Panel (Zero-key audit supported) */}
        <div className="mx-auto mt-4 max-w-2xl spawn spawn-5">
          {!ai.enabled && (
            <div className="rounded-xl border border-line bg-surface/50 px-4 py-2.5 glass-panel">
              <button
                type="button"
                onClick={() => setKeyOpen((v) => !v)}
                className="flex w-full items-center gap-2 text-left"
              >
                <span className="mono text-[11px] uppercase tracking-wider text-signal font-semibold">
                  AI Rewrite Key (Optional)
                </span>
                <span className="text-[12px] text-ink-dim flex items-center gap-1.5">
                  {ai.userKey ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-signal" />
                      <span>Session key active</span>
                    </>
                  ) : (
                    <span>Audits work without any key — add one to rewrite weak passages</span>
                  )}
                </span>
                <span
                  aria-hidden
                  className="mono ml-auto text-[12px] text-ink-faint transition-transform"
                  style={{ transform: keyOpen ? "rotate(90deg)" : "none" }}
                >
                  ›
                </span>
              </button>
              {keyOpen && (
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={ai.provider}
                      onChange={(e) =>
                        setAi((s) => ({ ...s, provider: e.target.value as AiState["provider"] }))
                      }
                      className="mono h-9 rounded-lg border border-line bg-base px-2.5 text-[12px] text-ink"
                    >
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="openai">OpenAI (GPT)</option>
                    </select>
                    <input
                      type="password"
                      value={ai.userKey}
                      onChange={(e) => saveKey(e.target.value)}
                      placeholder={ai.provider === "anthropic" ? "sk-ant-…" : "sk-…"}
                      autoComplete="off"
                      aria-label="API key"
                      className="mono h-9 flex-1 rounded-lg border border-line bg-base px-3 text-[12px] text-ink placeholder:text-ink-faint/70"
                    />
                  </div>
                  <p className="text-[11px] leading-relaxed text-ink-faint">
                    Saved in your browser tab only, never stored on disk or server.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {phase === "error" && error && (
        <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-danger/40 bg-danger/10 p-4 text-center">
          <p className="text-[13.5px] font-medium text-danger">{error}</p>
          <button
            type="button"
            onClick={() => setPhase("idle")}
            className="mono mt-2 text-[12px] text-ink-dim underline"
          >
            Try another URL
          </button>
        </div>
      )}

      {/* ── Scanning State ───────────────────────────────────────────────── */}
      {phase === "scanning" && (
        <section className="mx-auto mt-14 max-w-lg">
          <div className="card glass-panel-glow overflow-hidden p-6">
            <div className="relative mb-5 h-[3px] overflow-hidden rounded-full bg-line sweep" />
            <div className="mono text-center text-[12px] uppercase tracking-wider text-signal font-semibold mb-4">
              Running Diagnostic Pipeline
            </div>
            <ul className="space-y-3">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className="mono flex items-center gap-3 text-[12.5px] transition-colors"
                  style={{ color: i <= step ? "var(--color-ink)" : "var(--color-ink-faint)" }}
                >
                  <span
                    aria-hidden
                    className={`block h-2 w-2 rounded-full ${
                      i === step ? "bg-signal pulse-dot" : i < step ? "bg-signal" : "bg-line-bright"
                    }`}
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Results State ────────────────────────────────────────────────── */}
      {phase === "done" && report && (
        <div ref={resultsRef} className="mt-12">
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

      {/* ── Landing Page Interactive Showcase (Idle State) ───────────────── */}
      {phase === "idle" && (
        <div className="mt-16 space-y-28">
          {/* Interactive Centerpiece Mockup (Reference Image Style) */}
          <section className="relative mx-auto max-w-6xl">
            {/* Ambient Radial Glow behind device */}
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[800px] rounded-full bg-signal/18 blur-[130px] pointer-events-none"
            />

            {/* TOP TABS NAVIGATION (Put tabs at the top as requested) */}
            <div className="mb-6 flex items-center justify-center">
              <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-line/80 bg-void/90 p-1.5 shadow-xl backdrop-blur-md">
                {(
                  [
                    ["overview", "Overview"],
                    ["seo", "SEO"],
                    ["geo", "GEO / AI Search"],
                    ["crawlers", "AI Crawlers"],
                    ["robots", "Robots.txt"],
                    ["schema", "Schema Data"],
                    ["content", "Content"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPreviewTab(id)}
                    className={`mono rounded-xl px-3.5 py-1.5 text-[12px] transition-all ${
                      previewTab === id
                        ? "bg-signal text-void font-bold shadow-[0_0_14px_var(--color-signal-glow)]"
                        : "text-ink-dim hover:text-ink hover:bg-surface/60"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Showcase Stage Wrapper */}
            <div className="relative mx-auto max-w-4xl">
              {/* SPREAD-OUT FLOATING BADGES (Guaranteed 0% overlap outside card perimeter) */}
              {/* Floating Badge 1 (Left Gutters - Outside Card Bounds) */}
              <div className="hidden xl:flex absolute right-[calc(100%+28px)] top-12 float-badge items-center gap-3.5 rounded-2xl border border-line/80 bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-md z-30 w-[215px]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-signal/15 text-signal">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <div className="mono text-[10px] uppercase tracking-wider text-ink-faint">SEO Health</div>
                  <div className="mono text-[17px] font-bold text-ink">84 / 100</div>
                  <div className="text-[11px] text-ink-dim">Crawlable & Indexable</div>
                </div>
              </div>

              {/* Floating Badge 2 (Right Gutters - Outside Card Bounds) */}
              <div className="hidden xl:flex absolute left-[calc(100%+28px)] top-20 float-badge-delayed items-center gap-3.5 rounded-2xl border border-line/80 bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-md z-30 w-[225px]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-signal/15 text-signal">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <div className="mono text-[10px] uppercase tracking-wider text-ink-faint">AI Search Crawlers</div>
                  <div className="mono text-[17px] font-bold text-signal">Allowed 100%</div>
                  <div className="text-[11px] text-ink-dim">OAI-Search & ClaudeBot</div>
                </div>
              </div>

              {/* Floating Badge 3 (Bottom Center - Below Card Bounds) */}
              <div className="hidden lg:flex absolute top-[calc(100%+24px)] left-1/2 -translate-x-1/2 float-badge items-center gap-3 rounded-full border border-signal/30 bg-surface/95 px-6 py-2.5 shadow-2xl backdrop-blur-md z-30 whitespace-nowrap">
                <span className="h-2.5 w-2.5 rounded-full bg-signal pulse-dot" />
                <span className="mono text-[12px] font-semibold text-ink">
                  12 Issues Prioritized · 3 Critical · 5 Warnings · 4 Schema Recs
                </span>
              </div>

              {/* Centerpiece Mockup Frame */}
              <div className="card glass-panel-glow relative overflow-hidden rounded-3xl p-6 sm:p-8 z-10">
              {/* Device Window Chrome */}
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="block h-3 w-3 rounded-full bg-danger/80" />
                  <span className="block h-3 w-3 rounded-full bg-warn/80" />
                  <span className="block h-3 w-3 rounded-full bg-signal/80" />
                  <span className="mono ml-2 text-[12px] text-ink-dim">
                    audit.crawlspace.dev · stripe.com/docs/payments
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-signal pulse-dot" />
                  <span className="mono rounded-full border border-signal/30 bg-signal/10 px-3 py-0.5 text-[11px] font-semibold text-signal">
                    Live Simulator
                  </span>
                </div>
              </div>

              {/* Mockup Body Content */}
              <div className="mt-6 space-y-6">
                {/* Score Header Banner */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl border border-line bg-surface/60 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-signal/40 bg-signal/15 text-[28px] font-bold text-signal mono shadow-[0_0_20px_var(--color-signal-glow)]">
                      78
                    </div>
                    <div>
                      <div className="mono text-[11px] uppercase tracking-wider text-signal font-semibold">
                        Overall Visibility Score
                      </div>
                      <h3 className="text-[18px] font-bold text-ink">
                        Robust Foundation · High AI Citation Upside
                      </h3>
                      <p className="text-[12.5px] text-ink-faint">
                        Crawlable by all search bots, solid semantic headings, schema optimizations detected.
                      </p>
                    </div>
                  </div>
                  <div className="mono text-[11.5px] text-ink-dim flex items-center gap-2">
                    <span className="rounded-md border border-line bg-surface px-2 py-1">
                      Target: stripe.com
                    </span>
                    <span className="rounded-md border border-signal/30 bg-signal/10 px-2 py-1 text-signal">
                      v1.2 GEO
                    </span>
                  </div>
                </div>

                {/* Interactive Tab Viewports */}
                {previewTab === "overview" && (
                  <div className="space-y-4 rise">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-line bg-surface/40 p-4">
                        <span className="mono text-[10.5px] uppercase text-ink-faint">SEO Health</span>
                        <div className="mono mt-1 text-[24px] font-bold text-ink">84</div>
                        <span className="text-[11.5px] text-signal font-medium">Indexable & Canonical</span>
                      </div>
                      <div className="rounded-xl border border-line bg-surface/40 p-4">
                        <span className="mono text-[10.5px] uppercase text-ink-faint">GEO Citability</span>
                        <div className="mono mt-1 text-[24px] font-bold text-signal">71</div>
                        <span className="text-[11.5px] text-ink-dim">5-Engine Spread</span>
                      </div>
                      <div className="rounded-xl border border-line bg-surface/40 p-4">
                        <span className="mono text-[10.5px] uppercase text-ink-faint">AI Crawlers</span>
                        <div className="mono mt-1 text-[24px] font-bold text-signal">100%</div>
                        <span className="text-[11.5px] text-signal font-medium">Search Bots Allowed</span>
                      </div>
                      <div className="rounded-xl border border-line bg-surface/40 p-4">
                        <span className="mono text-[10.5px] uppercase text-ink-faint">Technical</span>
                        <div className="mono mt-1 text-[24px] font-bold text-ink">82</div>
                        <span className="text-[11.5px] text-ink-dim">200 OK · SSR Verified</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-line bg-surface/30 p-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px]">
                      <span className="text-ink-dim">
                        Priority Recommendation: Add explicit entity definition to H1 preamble for ChatGPT & Claude.
                      </span>
                      <Link
                        href="/dashboard"
                        className="mono font-semibold text-signal hover:underline shrink-0"
                      >
                        Explore in Dashboard →
                      </Link>
                    </div>
                  </div>
                )}

                {previewTab === "seo" && (
                  <div className="rounded-xl border border-line bg-surface/40 p-5 space-y-3.5 rise">
                    <div className="flex items-center justify-between text-[13px]">
                      <div>
                        <div className="font-semibold text-ink">Meta Title & Description</div>
                        <div className="text-[11.5px] text-ink-faint">56 chars title · 152 chars description (Optimal length)</div>
                      </div>
                      <span className="mono rounded bg-signal/15 text-signal px-2 py-0.5 text-[11px] font-bold">Passed</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px] border-t border-line/60 pt-3">
                      <div>
                        <div className="font-semibold text-ink">Heading Structure & Hierarchy</div>
                        <div className="text-[11.5px] text-ink-faint">1 H1 tag, 7 H2 tags, clean semantic progression</div>
                      </div>
                      <span className="mono rounded bg-signal/15 text-signal px-2 py-0.5 text-[11px] font-bold">Passed</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px] border-t border-line/60 pt-3">
                      <div>
                        <div className="font-semibold text-ink">Canonical & OpenGraph Tags</div>
                        <div className="text-[11.5px] text-ink-faint">Canonical matches URL · og:image, og:title, og:description present</div>
                      </div>
                      <span className="mono rounded bg-signal/15 text-signal px-2 py-0.5 text-[11px] font-bold">Passed</span>
                    </div>
                  </div>
                )}

                {previewTab === "geo" && (
                  <div className="rounded-xl border border-line bg-surface/40 p-5 space-y-4 rise">
                    <div className="flex items-center justify-between">
                      <h4 className="mono text-[12px] uppercase tracking-wider text-signal font-semibold">
                        Princeton GEO Empirical Uplift Metrics
                      </h4>
                      <span className="mono text-[11.5px] text-ink-faint">Tested on 5 engines</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border border-line bg-surface/60 p-3">
                        <div className="text-[11px] text-ink-faint">Source Citations</div>
                        <div className="mono text-[18px] font-bold text-signal">+40%</div>
                        <div className="text-[10px] text-ink-dim">Princeton lift benchmark</div>
                      </div>
                      <div className="rounded-lg border border-line bg-surface/60 p-3">
                        <div className="text-[11px] text-ink-faint">Statistical Evidence</div>
                        <div className="mono text-[18px] font-bold text-signal">+37%</div>
                        <div className="text-[10px] text-ink-dim">Quantitative data verified</div>
                      </div>
                      <div className="rounded-lg border border-line bg-surface/60 p-3">
                        <div className="text-[11px] text-ink-faint">Direct Quotations</div>
                        <div className="mono text-[18px] font-bold text-signal">+30%</div>
                        <div className="text-[10px] text-ink-dim">Expert attributions</div>
                      </div>
                      <div className="rounded-lg border border-line bg-surface/60 p-3">
                        <div className="text-[11px] text-ink-faint">Deixis Penalty</div>
                        <div className="mono text-[18px] font-bold text-warn">-12%</div>
                        <div className="text-[10px] text-ink-dim">Vague pronouns detected</div>
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === "crawlers" && (
                  <div className="rounded-xl border border-line bg-surface/40 p-5 space-y-3 rise">
                    <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
                      <span className="mono text-[12px] font-semibold text-ink">
                        AI Crawler Matrix: Search vs. Training Access
                      </span>
                      <span className="mono text-[11px] text-signal">Robots.txt verified</span>
                    </div>
                    <div className="space-y-2 text-[12.5px]">
                      <div className="flex justify-between items-center">
                        <span className="mono text-ink">OAI-SearchBot (ChatGPT Search Engine)</span>
                        <span className="mono rounded bg-signal/15 text-signal px-2 py-0.5 text-[11px] font-bold">Allowed · Citation Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="mono text-ink">ClaudeBot (Anthropic Search & Quotations)</span>
                        <span className="mono rounded bg-signal/15 text-signal px-2 py-0.5 text-[11px] font-bold">Allowed · Citation Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="mono text-ink">PerplexityBot (Perplexity Real-Time Index)</span>
                        <span className="mono rounded bg-signal/15 text-signal px-2 py-0.5 text-[11px] font-bold">Allowed · Citation Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="mono text-ink">GPTBot (OpenAI Training Scraper)</span>
                        <span className="mono rounded bg-warn/15 text-warn px-2 py-0.5 text-[11px] font-bold">Restricted (Training protected)</span>
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === "robots" && (
                  <div className="rounded-xl border border-line bg-surface/40 p-5 space-y-3 rise">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="mono font-semibold text-ink">robots.txt Live Directives</span>
                      <span className="mono text-signal">HTTP 200 · 8 Rules Detected</span>
                    </div>
                    <pre className="mono rounded-lg border border-line bg-base p-3 text-[11.5px] text-ink-dim overflow-x-auto">
{`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/internal/

# AI Search Crawlers (Explicitly Allowed)
User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://stripe.com/sitemap.xml`}
                    </pre>
                  </div>
                )}

                {previewTab === "schema" && (
                  <div className="rounded-xl border border-line bg-surface/40 p-5 space-y-3 rise">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="mono font-semibold text-ink">Schema.org JSON-LD Entities</span>
                      <span className="mono text-signal">3 Types Validated</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px]">
                      <div className="rounded-lg border border-line bg-surface/60 p-3">
                        <div className="mono font-bold text-signal">Organization</div>
                        <div className="text-[11px] text-ink-faint">Name, Logo, sameAs links</div>
                      </div>
                      <div className="rounded-lg border border-line bg-surface/60 p-3">
                        <div className="mono font-bold text-signal">WebSite</div>
                        <div className="text-[11px] text-ink-faint">URL, SearchAction declared</div>
                      </div>
                      <div className="rounded-lg border border-line bg-surface/60 p-3">
                        <div className="mono font-bold text-signal">BreadcrumbList</div>
                        <div className="text-[11px] text-ink-faint">Hierarchy validated</div>
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === "content" && (
                  <div className="rounded-xl border border-line bg-surface/40 p-5 space-y-3 rise">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="mono font-semibold text-ink">Content Extractability & Chunking</span>
                      <span className="mono text-signal">1,480 Words · 18 Blocks</span>
                    </div>
                    <div className="rounded-lg border border-line bg-surface/60 p-3 text-[12px]">
                      <div className="flex justify-between mono text-[11px] text-ink-faint border-b border-line pb-1 mb-2">
                        <span>Block #1: Preamble</span>
                        <span className="text-signal font-semibold">Extractability: 88/100</span>
                      </div>
                      <p className="text-[12px] text-ink-dim leading-relaxed">
                        “Stripe is a suite of APIs powering online payment processing and commerce solutions for internet businesses of all sizes.”
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

          {/* ── What We Analyze Section (All 7 Pillars) ───────────────────── */}
          <section id="analyze" className="space-y-8 pt-6">
            <div className="text-center">
              <span className="mono text-[11.5px] uppercase tracking-wider text-signal font-semibold">
                Comprehensive Diagnostic
              </span>
              <h2 className="mt-2 text-[28px] font-bold text-ink sm:text-[38px]">
                What We Analyze
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[14.5px] text-ink-dim">
                Seven dedicated intelligence layers examine every technical, semantic, and crawler
                vector influencing search engine rankings and AI model answers.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {/* 1. SEO */}
              <div className="card glass-panel p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/15 text-[18px] text-signal font-bold mono">
                    01
                  </span>
                  <div>
                    <h3 className="text-[16.5px] font-bold text-ink">SEO Fundamentals</h3>
                    <span className="mono text-[11px] text-signal">On-page indexability</span>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-dim">
                  Title tags, meta descriptions, semantic heading hierarchy (H1-H6), canonical URLs, OpenGraph social cards, Twitter cards, and viewport responsiveness.
                </p>
              </div>

              {/* 2. GEO / AI Search */}
              <div className="card glass-panel p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/15 text-[18px] text-signal font-bold mono">
                    02
                  </span>
                  <div>
                    <h3 className="text-[16.5px] font-bold text-ink">GEO / AI Search</h3>
                    <span className="mono text-[11px] text-signal">5-engine citability</span>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-dim">
                  Passage extractability, answerability, entity clarity, and citation readiness across ChatGPT, Claude, Perplexity, Copilot, and Google AI Overviews.
                </p>
              </div>

              {/* 3. Technical SEO */}
              <div className="card glass-panel p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/15 text-[18px] text-signal font-bold mono">
                    03
                  </span>
                  <div>
                    <h3 className="text-[16.5px] font-bold text-ink">Technical SEO</h3>
                    <span className="mono text-[11px] text-signal">SSR & latency</span>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-dim">
                  Server-side rendering verification vs client JS hurdles, HTTP status codes, latency benchmarks, Gzip/Brotli compression, and redirect chains.
                </p>
              </div>

              {/* 4. AI Crawler Analysis */}
              <div className="card glass-panel p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/15 text-[18px] text-signal font-bold mono">
                    04
                  </span>
                  <div>
                    <h3 className="text-[16.5px] font-bold text-ink">AI Crawler Analysis</h3>
                    <span className="mono text-[11px] text-signal">Search vs. training</span>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-dim">
                  Distinguishes search bots (OAI-SearchBot, ClaudeBot, PerplexityBot) from bulk training scrapers (GPTBot, CCBot), preventing accidental AI invisibility.
                </p>
              </div>

              {/* 5. Robots.txt */}
              <div className="card glass-panel p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/15 text-[18px] text-signal font-bold mono">
                    05
                  </span>
                  <div>
                    <h3 className="text-[16.5px] font-bold text-ink">Robots.txt Inspection</h3>
                    <span className="mono text-[11px] text-signal">Rule-by-rule translator</span>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-dim">
                  Full syntax validation, wildcard collision checks, blocked path verification, sitemap declarations, and plain-English explanations for every directive.
                </p>
              </div>

              {/* 6. Structured Data */}
              <div className="card glass-panel p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/15 text-[18px] text-signal font-bold mono">
                    06
                  </span>
                  <div>
                    <h3 className="text-[16.5px] font-bold text-ink">Structured Data (Schema)</h3>
                    <span className="mono text-[11px] text-signal">JSON-LD verification</span>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-dim">
                  Extracts and validates Schema.org entities (Organization, WebSite, Product, FAQPage, Article) and highlights missing high-impact attributes.
                </p>
              </div>

              {/* 7. Content Analysis (Spanning Full Width on LG) */}
              <div className="card glass-panel p-6 space-y-3 md:col-span-2 lg:col-span-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/15 text-[18px] text-signal font-bold mono">
                    07
                  </span>
                  <div>
                    <h3 className="text-[16.5px] font-bold text-ink">Content & Passage Analysis</h3>
                    <span className="mono text-[11px] text-signal">Extractability scoring</span>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-dim">
                  Evaluates block-by-block word counts against the 40–160 word citation sweet spot, detects deixis and ambiguous pronouns (&quot;as mentioned above&quot;), flags lost antecedents, and calculates semantic density.
                </p>
              </div>
            </div>
          </section>

          {/* ── How It Works Section ──────────────────────────────────────── */}
          <section id="how-it-works" className="space-y-8 pt-6">
            <div className="text-center">
              <span className="mono text-[11.5px] uppercase tracking-wider text-signal font-semibold">
                Execution Workflow
              </span>
              <h2 className="mt-2 text-[28px] font-bold text-ink sm:text-[38px]">
                How Crawlspace Works
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[14.5px] text-ink-dim">
                From live HTTP request to developer remediation code in under five seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="card glass-panel p-6 space-y-3 relative">
                <div className="mono text-[12px] font-bold text-signal">STEP 01</div>
                <h3 className="text-[18px] font-bold text-ink">Live Network Crawl</h3>
                <p className="text-[13px] text-ink-dim leading-relaxed">
                  Our SSRF-protected crawler fetches the live HTML document, inspects HTTP response headers, parses robots.txt directives, and locates declared XML sitemaps.
                </p>
              </div>

              <div className="card glass-panel p-6 space-y-3 relative">
                <div className="mono text-[12px] font-bold text-signal">STEP 02</div>
                <h3 className="text-[18px] font-bold text-ink">Multi-Pillar Engine Diagnostic</h3>
                <p className="text-[13px] text-ink-dim leading-relaxed">
                  We cross-examine the page against 5 distinct AI retrieval models and Google SEO rules, evaluating citation likelihood, structured data, and crawler permissions.
                </p>
              </div>

              <div className="card glass-panel p-6 space-y-3 relative">
                <div className="mono text-[12px] font-bold text-signal">STEP 03</div>
                <h3 className="text-[18px] font-bold text-ink">Turnkey Remediations & LLM Prompts</h3>
                <p className="text-[13px] text-ink-dim leading-relaxed">
                  Export ready-to-paste prompts for ChatGPT or Claude to fix your content, copy tailored JSON-LD code snippets, or download complete client-ready reports.
                </p>
              </div>
            </div>
          </section>

          {/* ── Example Audits Section ────────────────────────────────────── */}
          <section className="space-y-6 pt-6">
            <div className="text-center">
              <span className="mono text-[11.5px] uppercase tracking-wider text-signal font-semibold">
                Live Case Studies
              </span>
              <h2 className="mt-2 text-[28px] font-bold text-ink sm:text-[36px]">
                Explore Real Audits
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {EXAMPLES.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => {
                    setUrl(item.url);
                    void run(item.url);
                  }}
                  className="card glass-panel p-5 text-left transition-all hover:border-signal/50 hover:shadow-[0_0_20px_var(--color-signal-glow)] group"
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-[13px] font-bold text-ink group-hover:text-signal transition-colors">
                      {item.label}
                    </span>
                    <span className="mono text-[11px] text-ink-faint">→</span>
                  </div>
                  <div className="mono mt-1 text-[11px] text-ink-dim truncate">
                    {item.url}
                  </div>
                  <p className="mt-3 text-[12px] text-ink-faint leading-relaxed">
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* ── Pricing Section ───────────────────────────────────────────── */}
          <section id="pricing" className="space-y-8 pt-8">
            <div className="text-center">
              <span className="mono text-[11.5px] uppercase tracking-wider text-signal font-semibold">
                Transparent Pricing
              </span>
              <h2 className="mt-2 text-[28px] font-bold text-ink sm:text-[38px]">
                Simple, developer-first tiers
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[14.5px] text-ink-dim">
                Start for free with zero API key required. Upgrade when you need continuous monitoring and white-label client reports.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Free */}
              <div className="card glass-panel p-6 flex flex-col justify-between">
                <div>
                  <div className="mono text-[12px] font-bold text-ink-faint uppercase">Free</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="mono text-[36px] font-bold text-ink">$0</span>
                    <span className="text-[13px] text-ink-dim">/ forever</span>
                  </div>
                  <p className="mt-3 text-[13px] text-ink-dim">
                    For developers and site owners checking visibility on individual URLs.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-[12.5px] text-ink-dim border-t border-line pt-4">
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-signal shrink-0" /> Full 6-pillar visibility audit</li>
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-signal shrink-0" /> 5 AI engine citation scores</li>
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-signal shrink-0" /> AI Crawler & robots.txt analysis</li>
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-signal shrink-0" /> Copy turnkey LLM repair prompts</li>
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-signal shrink-0" /> Zero API key required</li>
                  </ul>
                </div>
                <Link
                  href="/#hero"
                  className="mono mt-8 block w-full rounded-xl border border-line bg-surface py-2.5 text-center text-[13px] font-semibold text-ink hover:border-signal/50 transition-colors"
                >
                  Start Free Audit
                </Link>
              </div>

              {/* Pro */}
              <div className="card glass-panel-glow p-6 flex flex-col justify-between border-signal/50 relative">
                <div className="absolute -top-3 right-5 mono rounded-full bg-signal px-3 py-0.5 text-[10px] font-bold uppercase text-void">
                  Most Popular
                </div>
                <div>
                  <div className="mono text-[12px] font-bold text-signal uppercase">Pro</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="mono text-[36px] font-bold text-ink">$39</span>
                    <span className="text-[13px] text-ink-dim">/ month</span>
                  </div>
                  <p className="mt-3 text-[13px] text-ink-dim">
                    For fast-growing companies and marketing leaders seeking consistent search & AI visibility.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-[12.5px] text-ink-dim border-t border-line pt-4">
                    <li className="flex items-center gap-2.5 text-ink"><Check className="h-4 w-4 text-signal shrink-0" /> Everything in Free</li>
                    <li className="flex items-center gap-2.5 text-ink"><Check className="h-4 w-4 text-signal shrink-0" /> Automated weekly scans & alert emails</li>
                    <li className="flex items-center gap-2.5 text-ink"><Check className="h-4 w-4 text-signal shrink-0" /> AI passage rewrite generator</li>
                    <li className="flex items-center gap-2.5 text-ink"><Check className="h-4 w-4 text-signal shrink-0" /> Score change history tracking</li>
                    <li className="flex items-center gap-2.5 text-ink"><Check className="h-4 w-4 text-signal shrink-0" /> Crawl up to 50 pages per audit</li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="mono mt-8 block w-full rounded-xl bg-signal py-2.5 text-center text-[13px] font-bold text-void hover:brightness-110 shadow-[0_0_14px_var(--color-signal-glow)] transition-all"
                >
                  Get Started with Pro
                </Link>
              </div>

              {/* Agency */}
              <div className="card glass-panel p-6 flex flex-col justify-between">
                <div>
                  <div className="mono text-[12px] font-bold text-ink-faint uppercase">Agency</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="mono text-[36px] font-bold text-ink">$129</span>
                    <span className="text-[13px] text-ink-dim">/ month</span>
                  </div>
                  <p className="mt-3 text-[13px] text-ink-dim">
                    For digital agencies and consultants delivering modern GEO/SEO client deliverables.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-[12.5px] text-ink-dim border-t border-line pt-4">
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-signal shrink-0" /> Everything in Pro</li>
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-signal shrink-0" /> White-label client reports (/report/:id)</li>
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-signal shrink-0" /> Custom brand logos on public reports</li>
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-signal shrink-0" /> Export branded client PDFs</li>
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-signal shrink-0" /> Multi-domain management dashboard</li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="mono mt-8 block w-full rounded-xl border border-line bg-surface py-2.5 text-center text-[13px] font-semibold text-ink hover:border-signal/50 transition-colors"
                >
                  Upgrade to Agency
                </Link>
              </div>
            </div>
          </section>

          {/* ── FAQ Section (Plus-Minus Interactive Accordion) ─────────────── */}
          <section id="faq" className="mx-auto max-w-3xl pt-8 space-y-6">
            <div className="text-center">
              <span className="mono text-[11.5px] uppercase tracking-wider text-signal font-semibold">
                FAQ
              </span>
              <h2 className="mt-2 text-[26px] font-bold text-ink sm:text-[34px]">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {FAQ.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={item.q}
                    className="card glass-panel overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-5 text-left"
                    >
                      <h3 className="text-[15px] font-semibold text-ink pr-4">
                        {item.q}
                      </h3>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-surface mono text-[16px] text-signal font-bold transition-transform">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-line/70 px-5 pb-5 pt-3 text-[13.5px] leading-relaxed text-ink-dim rise">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Final Call to Action ──────────────────────────────────────── */}
          <section className="card glass-panel-glow relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center">
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-signal/15 blur-[90px] pointer-events-none"
            />
            <div className="relative z-10 mx-auto max-w-2xl space-y-4">
              <span className="mono text-[11.5px] uppercase tracking-wider text-signal font-semibold">
                Start Auditing Today
              </span>
              <h2 className="text-[30px] font-bold text-ink sm:text-[42px] leading-tight">
                See how ready your website is for search and AI.
              </h2>
              <p className="text-[15px] text-ink-dim leading-relaxed">
                Run an instant audit with zero configuration or API key. Get actionable remediation
                guidance in seconds.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mono rounded-xl bg-signal px-6 py-3 text-[13.5px] font-bold text-void transition-all hover:brightness-110 shadow-[0_0_20px_var(--color-signal-glow)]"
                >
                  Enter Website URL Above ↑
                </button>
                <Link
                  href="/dashboard"
                  className="mono rounded-xl border border-line bg-surface px-6 py-3 text-[13.5px] font-semibold text-ink transition-colors hover:border-line-bright"
                >
                  Open Live Dashboard →
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
