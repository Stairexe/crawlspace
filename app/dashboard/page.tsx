"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import { CrawlspaceLogo } from "@/components/CrawlspaceLogo";
import type { AuditReport } from "@/lib/types";
import { CrawlerCenter } from "@/components/CrawlerCenter";
import { SchemaAnalyzer } from "@/components/SchemaAnalyzer";
import { RobotsAnalyzer } from "@/components/RobotsAnalyzer";
import { IssuesCenter } from "@/components/IssuesCenter";
import { PerformanceAnalyzer } from "@/components/PerformanceAnalyzer";
import { SpecializedPrompts } from "@/components/SpecializedPrompts";
import { ExportModal } from "@/components/ExportModal";
import { Generated } from "@/components/Generated";
import {
  LayoutDashboard,
  Zap,
  FileText,
  AlertTriangle,
  Search,
  Sparkles,
  Bot,
  Cpu,
  Code2,
  ShieldCheck,
  Globe,
  Gauge,
  TrendingUp,
  Clock,
  BarChart3,
  Settings,
  HelpCircle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Plus,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

type SidebarTab =
  | "overview"
  | "audit"
  | "pages"
  | "issues"
  | "seo"
  | "geo"
  | "crawlers"
  | "content"
  | "technical"
  | "schema"
  | "robots"
  | "sitemap"
  | "performance"
  | "prompts"
  | "history"
  | "changes"
  | "reports"
  | "settings"
  | "help";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTabFromUrl = (searchParams?.get("tab") as SidebarTab) || "overview";
  const domainFromUrl = searchParams?.get("domain");

  const [activeTab, setActiveTab] = useState<SidebarTab>(activeTabFromUrl);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [activeDomain, setActiveDomain] = useState(domainFromUrl || "");
  const [searchInput, setSearchInput] = useState(activeDomain);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [issuesFilter, setIssuesFilter] = useState<"all" | "critical" | "high" | "medium">("all");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (activeTabFromUrl && activeTabFromUrl !== activeTab) {
      setActiveTab(activeTabFromUrl);
    }
  }, [activeTabFromUrl, activeTab]);

  function switchTab(tab: SidebarTab) {
    setActiveTab(tab);
    setMobileDrawerOpen(false);
    router.push(`/dashboard?tab=${tab}`);
  }

  async function handleAuditRun(target: string) {
    const val = target.trim();
    if (!val) return;
    setIsScanning(true);
    setScanError(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: val }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "The survey failed.");
      // Only a successful survey changes what is on screen. A failed one must never
      // relabel the previous report with the new domain.
      setReport(json as AuditReport);
      setActiveDomain(val);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "The survey failed.");
    } finally {
      setIsScanning(false);
    }
  }

  if (!report) {
    return (
      <DashboardEmpty
        value={searchInput}
        onChange={setSearchInput}
        onRun={() => handleAuditRun(searchInput)}
        isScanning={isScanning}
      />
    );
  }

  const v = report.visibility;
  const e = report.evidence;

  return (
    <div className="flex min-h-screen bg-void text-ink">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r border-line/80 bg-surface/30 flex flex-col justify-between hidden md:flex">
        <div className="p-5 space-y-6">
          {/* Logo */}
          <Link href="/" className="block hover:opacity-90 transition-opacity">
            <CrawlspaceLogo size={28} />
          </Link>

          {/* Navigation Groups */}
          <nav className="space-y-6 text-[13px]">
            {/* Overview */}
            <div>
              <button
                type="button"
                onClick={() => switchTab("overview")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-medium transition-colors ${
                  activeTab === "overview"
                    ? "bg-signal text-void font-bold shadow-[0_0_14px_var(--color-signal-glow)]"
                    : "text-ink-dim hover:text-ink hover:bg-surface/50"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Overview</span>
              </button>
            </div>

            {/* AUDIT Group */}
            <div className="space-y-1">
              <div className="mono px-3 text-[10.5px] uppercase tracking-wider text-ink-faint font-semibold">
                Audit
              </div>
              {(
                [
                  ["audit", "Website Audit", Zap],
                  ["pages", "Pages", FileText],
                  ["issues", "Issues", AlertTriangle],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchTab(id as SidebarTab)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-left font-medium transition-colors ${
                    activeTab === id
                      ? "bg-signal/15 text-signal font-bold"
                      : "text-ink-dim hover:text-ink hover:bg-surface/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* ANALYSIS Group */}
            <div className="space-y-1">
              <div className="mono px-3 text-[10.5px] uppercase tracking-wider text-ink-faint font-semibold">
                Analysis
              </div>
              {(
                [
                  ["seo", "SEO", Search],
                  ["geo", "GEO", Sparkles],
                  ["crawlers", "AI Crawlers", Bot],
                  ["prompts", "AI Prompts", Sparkles],
                  ["content", "Content", FileText],
                  ["technical", "Technical", Cpu],
                  ["schema", "Schema", Code2],
                  ["robots", "Robots", ShieldCheck],
                  ["sitemap", "Sitemap", Globe],
                  ["performance", "Performance", Gauge],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchTab(id as SidebarTab)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-left font-medium transition-colors ${
                    activeTab === id
                      ? "bg-signal/15 text-signal font-bold"
                      : "text-ink-dim hover:text-ink hover:bg-surface/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* MONITORING Group */}
            <div className="space-y-1">
              <div className="mono px-3 text-[10.5px] uppercase tracking-wider text-ink-faint font-semibold">
                Monitoring
              </div>
              {(
                [
                  ["history", "History", TrendingUp],
                  ["changes", "Changes", Clock],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchTab(id as SidebarTab)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-left font-medium transition-colors ${
                    activeTab === id
                      ? "bg-signal/15 text-signal font-bold"
                      : "text-ink-dim hover:text-ink hover:bg-surface/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* REPORTS Group */}
            <div className="space-y-1">
              <div className="mono px-3 text-[10.5px] uppercase tracking-wider text-ink-faint font-semibold">
                Reports
              </div>
              <button
                type="button"
                onClick={() => switchTab("reports")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-left font-medium transition-colors ${
                  activeTab === "reports"
                    ? "bg-signal/15 text-signal font-bold"
                    : "text-ink-dim hover:text-ink hover:bg-surface/50"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Saved Reports</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-line/80 space-y-1 text-[13px]">
          <button
            type="button"
            onClick={() => switchTab("settings")}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
              activeTab === "settings"
                ? "bg-signal/15 text-signal font-bold"
                : "text-ink-dim hover:text-ink hover:bg-surface/50"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab("help")}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
              activeTab === "help"
                ? "bg-signal/15 text-signal font-bold"
                : "text-ink-dim hover:text-ink hover:bg-surface/50"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Help & Docs</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Drawer Modal ────────────────────────────────────────────── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-void/85 backdrop-blur-md"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer Menu */}
          <div className="relative z-10 w-4/5 max-w-[320px] h-full bg-surface-raised border-r border-line p-5 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-line/80 pb-4">
                <CrawlspaceLogo size={24} />
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-xl p-2 text-ink-dim hover:text-ink hover:bg-surface border border-line/50 transition-colors"
                  aria-label="Close navigation drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation links grouped */}
              <nav className="space-y-5 text-[13px]">
                {/* Overview */}
                <button
                  type="button"
                  onClick={() => switchTab("overview")}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left font-medium transition-all ${
                    activeTab === "overview"
                      ? "bg-signal text-void font-bold shadow-[0_0_14px_var(--color-signal-glow)]"
                      : "text-ink-dim hover:text-ink hover:bg-surface"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span>Overview</span>
                </button>

                {/* Audit Group */}
                <div className="space-y-1">
                  <div className="mono px-3 text-[10.5px] uppercase tracking-wider text-ink-faint font-semibold">
                    Audit
                  </div>
                  {(
                    [
                      ["audit", "Website Audit", Zap],
                      ["pages", "Crawled Pages", FileText],
                      ["issues", "Priority Issues", AlertTriangle],
                    ] as const
                  ).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => switchTab(id as SidebarTab)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left font-medium transition-all ${
                        activeTab === id
                          ? "bg-signal/15 text-signal font-bold"
                          : "text-ink-dim hover:text-ink hover:bg-surface"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Analysis Group */}
                <div className="space-y-1">
                  <div className="mono px-3 text-[10.5px] uppercase tracking-wider text-ink-faint font-semibold">
                    Engine Deep Dives
                  </div>
                  {(
                    [
                      ["seo", "SEO Engine", Search],
                      ["geo", "GEO Engine (5 AI)", Sparkles],
                      ["crawlers", "AI Crawlers", Bot],
                      ["prompts", "Turnkey AI Prompts", Sparkles],
                      ["content", "Content & Extraction", Cpu],
                      ["technical", "Technical Health", Code2],
                      ["schema", "Schema / JSON-LD", ShieldCheck],
                      ["robots", "Robots.txt Rules", Globe],
                      ["sitemap", "Sitemap XML", FileText],
                      ["performance", "Performance & TTFB", Gauge],
                    ] as const
                  ).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => switchTab(id as SidebarTab)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left font-medium transition-all ${
                        activeTab === id
                          ? "bg-signal/15 text-signal font-bold"
                          : "text-ink-dim hover:text-ink hover:bg-surface"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Monitoring */}
                <div className="space-y-1">
                  <div className="mono px-3 text-[10.5px] uppercase tracking-wider text-ink-faint font-semibold">
                    Monitoring
                  </div>
                  {(
                    [
                      ["history", "Score History", Clock],
                      ["reports", "Saved Reports", BarChart3],
                    ] as const
                  ).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => switchTab(id as SidebarTab)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left font-medium transition-all ${
                        activeTab === id
                          ? "bg-signal/15 text-signal font-bold"
                          : "text-ink-dim hover:text-ink hover:bg-surface"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </nav>
            </div>

            <div className="pt-4 border-t border-line/80 space-y-1 text-[13px]">
              <button
                type="button"
                onClick={() => switchTab("settings")}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left transition-colors ${
                  activeTab === "settings"
                    ? "bg-signal/15 text-signal font-bold"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab("help")}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left transition-colors ${
                  activeTab === "help"
                    ? "bg-signal/15 text-signal font-bold"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>Help & Docs</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Application Viewport ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
        {/* Dashboard Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-void/85 px-4 sm:px-6 backdrop-blur-xl gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-xl min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:border-line-bright"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Quick URL Switcher */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleAuditRun(searchInput);
              }}
              className="flex-1 relative min-w-0"
            >
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Audit URL or domain..."
                className="mono h-10 w-full rounded-xl border border-line bg-surface px-3 sm:px-3.5 text-[12px] sm:text-[13px] text-ink placeholder:text-ink-faint/60 transition-all focus:border-signal focus:shadow-[0_0_15px_var(--color-signal-glow)] truncate"
              />
            </form>
            <button
              type="button"
              onClick={() => void handleAuditRun(searchInput)}
              disabled={isScanning}
              className="mono h-10 rounded-xl bg-signal px-3.5 sm:px-4 text-[12px] sm:text-[12.5px] font-bold text-void hover:brightness-110 disabled:opacity-50 shrink-0"
            >
              {isScanning ? "Scanning…" : "Scan"}
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/"
              className="mono hidden lg:flex items-center gap-1.5 rounded-xl border border-signal/40 bg-signal/10 px-3.5 py-1.5 text-[12px] font-bold text-signal hover:bg-signal/20 transition-all"
            >
              <span>+ New survey</span>
            </Link>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="mono rounded-xl border border-line bg-surface px-2.5 sm:px-3 py-1.5 text-[11.5px] sm:text-[12px] font-medium text-ink hover:border-line-bright transition-colors"
            >
              <span className="hidden sm:inline">Export Report ↗</span>
              <span className="sm:hidden">Export ↗</span>
            </button>
          </div>
        </header>

        {/* ── Mobile Horizontal Swipeable Tab Strip (Under Topbar) ───────────── */}
        <div className="md:hidden border-b border-line/80 bg-surface/40 px-3 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
          {[
            { id: "overview", label: "Overview" },
            { id: "audit", label: "Audit" },
            { id: "seo", label: "SEO" },
            { id: "geo", label: "GEO" },
            { id: "crawlers", label: "Crawlers" },
            { id: "prompts", label: "AI Prompts" },
            { id: "content", label: "Content" },
            { id: "technical", label: "Technical" },
            { id: "schema", label: "Schema" },
            { id: "robots", label: "Robots" },
            { id: "performance", label: "Speed" },
            { id: "issues", label: "Issues" },
            { id: "pages", label: "Pages" },
            { id: "history", label: "History" },
            { id: "reports", label: "Reports" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id as SidebarTab)}
              className={`tab-btn whitespace-nowrap rounded-lg px-3 py-1 text-[12px] font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-signal text-void shadow-[0_0_10px_var(--color-signal-glow)]"
                  : "bg-surface border border-line text-ink-dim hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Body */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl w-full">
          {/* Active Target Banner */}
          <div className="card glass-panel p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              {/* Huge Overall Score */}
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border border-signal/40 bg-signal/15 text-[28px] sm:text-[34px] font-bold text-signal num shadow-[0_0_24px_var(--color-signal-glow)]">
                {v.overall}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="mono text-[10.5px] sm:text-[11px] uppercase tracking-wider text-signal font-semibold">
                    Website Visibility Score
                  </span>
                  <span className="mono text-[10.5px] sm:text-[11px] text-ink-faint hidden sm:inline">
                    • Inspected <time dateTime={e.fetchedAt}>{new Date(e.fetchedAt).toLocaleString()}</time>
                  </span>
                </div>
                <h1 className="font-satoshi text-[18px] sm:text-[24px] lg:text-[26px] font-bold text-ink mt-0.5 truncate">
                  {new URL(e.finalUrl).host + new URL(e.finalUrl).pathname.replace(/\/$/, "")}
                </h1>
                <p className="text-[12px] sm:text-[13px] text-ink-dim mt-0.5 line-clamp-2">
                  {report.summary}
                </p>
                {scanError && (
                  <p role="alert" className="mt-1 text-[12.5px] text-danger">
                    Survey of {activeDomain || "that URL"} failed: {scanError} The report below is the previous one.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => void handleAuditRun(activeDomain)}
                disabled={isScanning}
                className="mono flex-1 sm:flex-initial rounded-xl bg-signal px-3.5 sm:px-4 py-2 text-[12px] sm:text-[12.5px] font-bold text-void hover:brightness-110 shadow-[0_0_14px_var(--color-signal-glow)] text-center"
              >
                {isScanning ? "Scanning…" : "Scan Again"}
              </button>
              <button
                type="button"
                onClick={() => setGenerateOpen(true)}
                className="mono flex-1 sm:flex-initial rounded-xl border border-line bg-surface px-3.5 sm:px-4 py-2 text-[12px] sm:text-[12.5px] font-medium text-ink hover:border-line-bright text-center"
              >
                Generate llms.txt & Fixes
              </button>
            </div>
          </div>

          {/* ── Subscores Strip ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7 sm:gap-3">
            {[
              {
                id: "seo",
                label: "SEO",
                score: v.seo,
                status: /noindex/i.test(`${e.robots.metaRobots ?? ""} ${e.robots.xRobotsTag ?? ""}`) ? "noindex" : "Indexable",
              },
              { id: "geo", label: "GEO", score: v.geo, status: "5 engines" },
              { id: "technical", label: "Technical", score: v.technical, status: `HTTP ${e.status}` },
              { id: "content", label: "Content", score: v.content, status: `${e.html.textWords.toLocaleString("en-US")} words` },
              {
                id: "schema",
                label: "Schema",
                score: v.schema,
                status: `${new Set(e.jsonLd.flatMap((j) => j.types)).size} types`,
              },
              {
                id: "crawlers",
                label: "AI Crawlers",
                score: v.crawlers,
                status: `${Object.values(report.engines).filter((x) => !x.capped).length}/5 not gated`,
              },
              { id: "performance", label: "Page fetch", score: `${e.timings.fetchMs}ms`, status: "Measured" },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => switchTab(sub.id as SidebarTab)}
                className="card glass-panel p-3.5 sm:p-4 text-left transition-all hover:border-signal/50 hover:shadow-[0_0_16px_var(--color-signal-glow)]"
              >
                <div className="mono text-[10px] sm:text-[10.5px] uppercase tracking-wider text-ink-faint truncate">
                  {sub.label}
                </div>
                <div className="num mt-1 text-[20px] sm:text-[22px] font-bold text-ink">
                  {sub.score}
                </div>
                <div className="text-[10.5px] sm:text-[11px] text-signal font-medium mt-0.5 truncate">
                  {sub.status}
                </div>
              </button>
            ))}
          </div>

          {/* ── VIEWPORT CONTENT SWITCHER ─────────────────────────────────────── */}
          <div className="tab-viewport min-h-[580px] w-full transition-all">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8 tab-transition">
              {/* Priority Issues & Recommended Actions */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Priority Issues */}
                <div className="card glass-panel p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[17px] font-bold text-ink">Priority Issues</h2>
                      <p className="text-[12px] text-ink-dim">
                        Ranked by impact on search indexing and AI citability
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchTab("issues")}
                      className="mono text-[11.5px] text-signal font-semibold hover:underline"
                    >
                      View all ({report.findings.length}) →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {report.findings.slice(0, 4).map((f) => (
                      <div
                        key={f.checkId}
                        className="rounded-xl border border-line bg-surface/50 p-3.5 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`mono rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                f.severity === "critical"
                                  ? "bg-danger/15 text-danger"
                                  : f.severity === "high"
                                  ? "bg-warn/15 text-warn"
                                  : "bg-signal/15 text-signal"
                              }`}
                            >
                              {f.severity}
                            </span>
                            <span className="mono text-[11px] text-ink-faint">
                              {f.effort} effort
                            </span>
                          </div>
                          <h4 className="text-[13.5px] font-semibold text-ink mt-1">
                            {f.label}
                          </h4>
                          <p className="text-[12px] text-ink-dim mt-0.5">
                            {f.evidence}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score history: nothing is stored, so there is none to show */}
                <div className="card p-6 space-y-3">
                  <h2 className="text-[17px] font-bold text-ink">Score history</h2>
                  <p className="text-[13px] leading-relaxed text-ink-dim">
                    There is no history yet. Surveys are not stored, so this one has nothing to be
                    compared against. Export each survey to track changes by hand until saved
                    surveys arrive with accounts.
                  </p>
                  <button type="button" onClick={() => setExportOpen(true)} className="btn-quiet">
                    Export this survey
                  </button>
                </div>
              </div>

                          </div>
          )}

                    {/* TAB 2: AUDIT & SUB-ANALYSES */}
          {activeTab === "audit" && (
            <div className="space-y-6 tab-transition">
              <div className="card glass-panel p-6">
                <h2 className="text-[18px] font-bold text-ink mb-1">Live Audit View</h2>
                <p className="text-[13px] text-ink-dim mb-4">
                  Inspecting {activeDomain} across all 6 diagnostic pillars.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-line bg-surface/50 p-4">
                    <div className="mono text-[11px] text-ink-faint uppercase">Target URL</div>
                    <div className="mono font-semibold text-ink mt-1 break-all">{e.finalUrl}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface/50 p-4">
                    <div className="mono text-[11px] text-ink-faint uppercase">Server Response</div>
                    <div className="mono font-semibold text-signal mt-1">HTTP {e.status} · {e.timings.totalMs}ms</div>
                  </div>
                </div>
              </div>
              <IssuesCenter findings={report.findings} />
            </div>
          )}

          {/* TAB 3: SEO */}
          {activeTab === "seo" && (
            <div className="space-y-6 tab-transition">
              <div className="card glass-panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[18px] font-bold text-ink">SEO Fundamentals</h2>
                    <p className="text-[13px] text-ink-dim">
                      Core on-page elements required for Google and Bing indexing
                    </p>
                  </div>
                  <div className="mono text-[22px] font-bold text-signal">{v.seo} / 100</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2">
                    <div className="mono text-[11px] text-ink-faint uppercase">Meta Title</div>
                    <div className="font-semibold text-ink">{e.html.title ?? "Missing"}</div>
                    <div className="text-[11.5px] text-ink-dim font-medium">
                      {e.html.title ? `${e.html.title.length} characters` : "No title tag found"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2">
                    <div className="mono text-[11px] text-ink-faint uppercase">Meta Description</div>
                    <div className="text-[13px] text-ink-dim">{e.html.metaDescription ?? "Missing"}</div>
                    <div className="text-[11.5px] text-ink-dim font-medium">
                      {e.html.metaDescription ? `${e.html.metaDescription.length} characters` : "No meta description found"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2">
                    <div className="mono text-[11px] text-ink-faint uppercase">Heading Hierarchy</div>
                    <div className="mono text-[13px] text-ink">
                      {e.semantics.h1Count} H1 · {e.headings.filter((h) => h.level === 2).length} H2s · {e.headings.length} Total Headings
                    </div>
                    <div className="text-[11.5px] text-ink-dim font-medium">
                      {e.semantics.h1Count === 1 ? "One H1" : e.semantics.h1Count === 0 ? "No H1" : `${e.semantics.h1Count} H1s — use one`}
                    </div>
                  </div>

                  <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2">
                    <div className="mono text-[11px] text-ink-faint uppercase">Canonical Tag</div>
                    <div className="mono text-[12px] text-ink break-all">{e.html.canonical ?? "Missing"}</div>
                    <div className="text-[11.5px] text-ink-dim font-medium">
                      {!e.html.canonical
                        ? "No canonical link element"
                        : e.html.canonical.replace(/\/$/, "") === e.finalUrl.replace(/\/$/, "")
                          ? "Points at this URL"
                          : "Points at a different URL"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GEO */}
          {activeTab === "geo" && (
            <div className="space-y-6 tab-transition">
              <div className="card glass-panel p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[18px] font-bold text-ink">GEO / Generative Engine Readiness</h2>
                    <p className="text-[13px] text-ink-dim">
                      5-Engine citation modeling across ChatGPT, Claude, Perplexity, Copilot, and Google AI Overviews
                    </p>
                  </div>
                  <div className="mono text-[22px] font-bold text-signal">{v.geo} / 100</div>
                </div>

                {/* 5 Engines Breakdown */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {Object.entries(report.engines).map(([eng, data]) => (
                    <div key={eng} className="rounded-xl border border-line bg-surface/50 p-4 text-center">
                      <div className="mono text-[11px] uppercase tracking-wider text-ink-faint">
                        {eng.toUpperCase()}
                      </div>
                      <div className="mono mt-1 text-[24px] font-bold text-signal">{data.score}</div>
                      <div className="text-[11px] text-ink-dim mt-0.5">Citation score</div>
                    </div>
                  ))}
                </div>

                {/* Princeton GEO Factors */}
                <div className="rounded-xl border border-line bg-surface/40 p-5 space-y-3">
                  <h3 className="text-[15px] font-bold text-ink">Princeton GEO Uplift Benchmarks</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-line bg-surface p-3">
                      <div className="mono text-[11px] text-ink-faint">Citing Sources</div>
                      <div className="mono text-[18px] font-bold text-signal">+40% Lift</div>
                      <div className="text-[11px] text-ink-dim">Largest single lift in the study</div>
                    </div>
                    <div className="rounded-lg border border-line bg-surface p-3">
                      <div className="mono text-[11px] text-ink-faint">Adding Statistics</div>
                      <div className="mono text-[18px] font-bold text-signal">+37% Lift</div>
                      <div className="text-[11px] text-ink-dim">Specific figures in the passage</div>
                    </div>
                    <div className="rounded-lg border border-line bg-surface p-3">
                      <div className="mono text-[11px] text-ink-faint">Direct Quotations</div>
                      <div className="mono text-[18px] font-bold text-signal">+30% Lift</div>
                      <div className="text-[11px] text-ink-dim">Authoritative quotes provide clean extraction</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI CRAWLERS */}
          {activeTab === "crawlers" && (
            <div className="space-y-6 tab-transition">
              <CrawlerCenter evidence={e} />
            </div>
          )}

          {/* TAB 6: SCHEMA */}
          {activeTab === "schema" && (
            <div className="space-y-6 tab-transition">
              <SchemaAnalyzer evidence={e} />
            </div>
          )}

          {/* TAB 7: ROBOTS */}
          {activeTab === "robots" && (
            <div className="space-y-6 tab-transition">
              <RobotsAnalyzer evidence={e} />
            </div>
          )}

          {/* TAB 8: CONTENT */}
          {activeTab === "content" && (
            <div className="space-y-6 tab-transition">
              <div className="card glass-panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[18px] font-bold text-ink">Content & Block Analysis</h2>
                    <p className="text-[13px] text-ink-dim">
                      Segmenting content blocks into citation extractability bands
                    </p>
                  </div>
                  <div className="mono text-[22px] font-bold text-signal">{v.content} / 100</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-line bg-surface/50 p-4">
                    <div className="mono text-[10.5px] uppercase text-ink-faint">Total Words</div>
                    <div className="mono text-[20px] font-bold text-ink mt-1">{e.html.textWords}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface/50 p-4">
                    <div className="mono text-[10.5px] uppercase text-ink-faint">Reading Time</div>
                    <div className="mono text-[20px] font-bold text-ink mt-1">{Math.ceil(e.html.textWords / 220)} min</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface/50 p-4">
                    <div className="mono text-[10.5px] uppercase text-ink-faint">Best-scoring length</div>
                    <div className="mono text-[20px] font-bold text-signal mt-1">40–60 w</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface/50 p-4">
                    <div className="mono text-[10.5px] uppercase text-ink-faint">Weakest Blocks</div>
                    <div className="mono text-[20px] font-bold text-warn mt-1">{report.weakestBlocks.length}</div>
                  </div>
                </div>

                {/* Blocks Breakdown */}
                <div className="space-y-3 pt-2">
                  {report.weakestBlocks.map((b) => (
                    <div key={b.id} className="rounded-xl border border-line bg-surface/40 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="mono text-[11px] uppercase tracking-wider text-signal font-semibold">
                          {b.kind} block · {b.words} words
                        </span>
                        <span className="mono text-[12px] font-bold text-signal">
                          Block score: {Math.round(b.scores.total * 100)}/100
                        </span>
                      </div>
                      <p className="text-[13px] text-ink leading-relaxed">&ldquo;{b.text}&rdquo;</p>
                      <div className="text-[11.5px] text-ink-dim border-t border-line/60 pt-2">
                        {b.notes.join(" ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: SITEMAP */}
          {activeTab === "sitemap" && (
            <div className="space-y-6 tab-transition">
              <div className="card p-6 space-y-4">
                <div>
                  <h2 className="text-[18px] font-bold text-ink">Sitemap</h2>
                  <p className="text-[13px] text-ink-dim">
                    What the survey found at /sitemap.xml and in robots.txt. Individual sitemap URLs
                    are not fetched or checked.
                  </p>
                </div>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    ["Sitemap file", e.sitemap.found ? "Found" : "Not found"],
                    ["Declared in robots.txt", e.sitemap.inRobots ? "Yes" : "No"],
                    ["URLs listed", typeof e.sitemap.urlCount === "number" ? String(e.sitemap.urlCount) : "Not counted"],
                  ].map(([k, val]) => (
                    <div key={k} className="rounded-[3px] border border-line bg-surface p-4">
                      <dt className="tb-label">{k}</dt>
                      <dd className="mono mt-1 text-[14px] text-ink">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          {/* TAB: PERFORMANCE */}
          {activeTab === "performance" && (
            <div className="space-y-6 tab-transition">
              <PerformanceAnalyzer evidence={e} />
            </div>
          )}

          {/* TAB: SPECIALIZED AI PROMPTS */}
          {activeTab === "prompts" && (
            <div className="space-y-6 tab-transition">
              <SpecializedPrompts report={report} />
            </div>
          )}

          {/* TAB 10: PAGES */}
          {activeTab === "pages" && (
            <div className="space-y-6 tab-transition">
              <div className="card p-6 space-y-4">
                <div>
                  <h2 className="text-[18px] font-bold text-ink">Pages surveyed</h2>
                  <p className="text-[13px] text-ink-dim">
                    Crawlspace surveys one page at a time. Multi-page crawls are not built yet, so
                    this table has exactly one row.
                  </p>
                </div>
                <div tabIndex={0} role="region" aria-label="Pages table" className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-line mono text-[11px] uppercase tracking-wider text-ink-faint">
                        <th className="pb-3 pr-4 font-semibold">URL</th>
                        <th className="pb-3 pr-4 font-semibold">Status</th>
                        {Object.keys(report.engines).map((eng) => (
                          <th key={eng} className="pb-3 pr-4 font-semibold">{eng}</th>
                        ))}
                        <th className="pb-3 font-semibold">Defects</th>
                      </tr>
                    </thead>
                    <tbody className="mono">
                      <tr>
                        <td className="py-3 pr-4 font-semibold text-ink">{e.finalUrl}</td>
                        <td className="py-3 pr-4 text-ink">{e.status}</td>
                        {Object.entries(report.engines).map(([eng, data]) => (
                          <td key={eng} className="py-3 pr-4 text-ink">
                            {data.score}
                            {data.capped ? " (gated)" : ""}
                          </td>
                        ))}
                        <td className="py-3 text-ink">{report.findings.length}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: ISSUES */}
          {activeTab === "issues" && (
            <div className="space-y-6 tab-transition">
              <div className="flex items-center gap-2 mb-2">
                {(["all", "critical", "high", "medium"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setIssuesFilter(filter)}
                    className={`mono rounded-xl px-3 py-1.5 text-[12px] uppercase font-semibold transition-all ${
                      issuesFilter === filter
                        ? "bg-signal text-void shadow-[0_0_12px_var(--color-signal-glow)]"
                        : "border border-line bg-surface text-ink-dim hover:text-ink"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <IssuesCenter
                findings={
                  issuesFilter === "all"
                    ? report.findings
                    : report.findings.filter((f) => f.severity === issuesFilter)
                }
              />
            </div>
          )}

          {/* TAB 12: HISTORY */}
{activeTab === "history" && (
            <div className="space-y-6 tab-transition">
              <div className="card p-6 space-y-3">
                <h2 className="text-[18px] font-bold text-ink">History</h2>
                <p className="max-w-xl text-[13.5px] leading-relaxed text-ink-dim">
                  There is no history yet. Surveys are not stored, so no earlier score exists to
                  compare with. History arrives with accounts.
                </p>
              </div>
            </div>
          )}

                    {/* TAB 13: REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6 tab-transition">
              <div className="card p-6 space-y-4">
                <h2 className="text-[18px] font-bold text-ink">Saved surveys</h2>
                <p className="max-w-xl text-[13.5px] leading-relaxed text-ink-dim">
                  Nothing is saved yet. Crawlspace has no accounts or storage, so a survey lives only
                  in this tab. Saved and shareable surveys arrive with accounts. Until then, export
                  this one to keep it.
                </p>
                <button type="button" onClick={() => setExportOpen(true)} className="btn-primary">
                  Export this survey
                </button>
              </div>
            </div>
          )}

          {/* TAB 14: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6 tab-transition">
              <div className="card p-6 space-y-4">
                <h2 className="text-[18px] font-bold text-ink">Settings</h2>
                <p className="max-w-xl text-[13.5px] leading-relaxed text-ink-dim">
                  There is nothing to configure yet. Monitoring, alerts and saved domains need
                  accounts, which are not built. The only setting today is the optional rewrite key,
                  entered on the home page and kept in your browser tab.
                </p>
              </div>
            </div>
          )}

          {/* TAB 15: HELP & DOCS */}
          {activeTab === "help" && (
            <div className="space-y-6 tab-transition">
              <div className="card glass-panel p-6 space-y-4">
                <h2 className="text-[18px] font-bold text-ink">Documentation & Methodology</h2>
                <p className="text-[13px] text-ink-dim">
                  How Crawlspace computes visibility scores and verifies LLM citation readiness
                </p>

                <div className="space-y-3 pt-2">
                  <div className="rounded-xl border border-line bg-surface/50 p-4">
                    <h3 className="font-semibold text-ink">Why five engine weights?</h3>
                    <p className="text-[12.5px] text-ink-dim mt-1 leading-relaxed">
                      Google statements emphasize traditional content quality without requiring special AI files. Conversely, ChatGPT, Claude, and Perplexity reward structured extractability and llms.txt files. Crawlspace evaluates your URL through five separate weight vectors to avoid misleading averages.
                    </p>
                  </div>

                  <div className="rounded-xl border border-line bg-surface/50 p-4">
                    <h3 className="font-semibold text-ink">Zero-Key Guarantee</h3>
                    <p className="text-[12.5px] text-ink-dim mt-1 leading-relaxed">
                      All audit reports, robots analysis, schema validation, and citation scoring run entirely without needing an API key. API keys are only required if you choose to trigger real-time AI passage rewriting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        report={report}
      />

      {/* Generation Drawer */}
      {generateOpen && (
        <Generated
          onClose={() => setGenerateOpen(false)}
          report={report}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center mono text-ink-faint">Loading Dashboard…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
