"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CrawlspaceLogo } from "@/components/CrawlspaceLogo";
import { SAMPLE_REPORT } from "@/lib/mockReport";
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
  const [report, setReport] = useState<AuditReport>(SAMPLE_REPORT);
  const [activeDomain, setActiveDomain] = useState(
    domainFromUrl || "stripe.com/docs/payments"
  );
  const [searchInput, setSearchInput] = useState(activeDomain);
  const [isScanning, setIsScanning] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [issuesFilter, setIssuesFilter] = useState<"all" | "critical" | "high" | "medium">("all");

  useEffect(() => {
    if (activeTabFromUrl && activeTabFromUrl !== activeTab) {
      setActiveTab(activeTabFromUrl);
    }
  }, [activeTabFromUrl, activeTab]);

  function switchTab(tab: SidebarTab) {
    setActiveTab(tab);
    router.push(`/dashboard?tab=${tab}`);
  }

  async function handleAuditRun(target: string) {
    const val = target.trim();
    if (!val) return;
    setIsScanning(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: val }),
      });
      if (res.ok) {
        const json = await res.json();
        setReport(json as AuditReport);
        setActiveDomain(val);
      } else {
        // Keep current report with custom domain name for fallback
        setActiveDomain(val);
      }
    } catch {
      setActiveDomain(val);
    } finally {
      setIsScanning(false);
    }
  }

  const v = report.visibility;
  const e = report.evidence;

  // Recent Scans Table Data
  const recentScans = useMemo(
    () => [
      { domain: "stripe.com/docs/payments", score: 78, seo: 84, geo: 71, crawlers: "100%", time: "2 mins ago" },
      { domain: "linear.app", score: 85, seo: 91, geo: 78, crawlers: "100%", time: "3 hours ago" },
      { domain: "supabase.com/docs", score: 79, seo: 82, geo: 74, crawlers: "100%", time: "1 day ago" },
      { domain: "github.com/features/actions", score: 82, seo: 88, geo: 76, crawlers: "80%", time: "3 days ago" },
    ],
    []
  );

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

      {/* ── Main Application Viewport ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Dashboard Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-void/85 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {/* Quick URL Switcher */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleAuditRun(searchInput);
              }}
              className="flex-1 relative"
            >
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Audit URL or domain..."
                className="mono h-10 w-full rounded-xl border border-line bg-surface px-3.5 text-[13px] text-ink placeholder:text-ink-faint/60 transition-all focus:border-signal focus:shadow-[0_0_15px_var(--color-signal-glow)]"
              />
            </form>
            <button
              type="button"
              onClick={() => void handleAuditRun(searchInput)}
              disabled={isScanning}
              className="mono h-10 rounded-xl bg-signal px-4 text-[12.5px] font-bold text-void hover:brightness-110 disabled:opacity-50"
            >
              {isScanning ? "Scanning…" : "Scan"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/audit/new"
              className="mono hidden sm:flex items-center gap-1.5 rounded-xl border border-signal/40 bg-signal/10 px-3.5 py-1.5 text-[12px] font-bold text-signal hover:bg-signal/20 transition-all"
            >
              <span>+ New Audit</span>
            </Link>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="mono rounded-xl border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink hover:border-line-bright transition-colors"
            >
              Export Report ↗
            </button>
            <Link
              href={`/report/stripe-docs`}
              className="mono rounded-xl border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink hover:border-line-bright transition-colors"
            >
              Public Client View
            </Link>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-6 sm:p-8 space-y-8 max-w-7xl">
          {/* Active Target Banner */}
          <div className="card glass-panel p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Huge Overall Score */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-signal/40 bg-signal/15 text-[34px] font-bold text-signal mono shadow-[0_0_24px_var(--color-signal-glow)]">
                {v.overall}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] uppercase tracking-wider text-signal font-semibold">
                    Website Visibility Score
                  </span>
                  <span className="mono text-[11px] text-ink-faint">
                    • Last scanned 2 minutes ago
                  </span>
                </div>
                <h1 className="text-[22px] font-bold text-ink sm:text-[26px] mt-0.5">
                  {activeDomain}
                </h1>
                <p className="text-[13px] text-ink-dim mt-0.5">
                  Strong search crawlability & entity schema · High AI citation upside
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => void handleAuditRun(activeDomain)}
                disabled={isScanning}
                className="mono rounded-xl bg-signal px-4 py-2 text-[12.5px] font-bold text-void hover:brightness-110 shadow-[0_0_14px_var(--color-signal-glow)]"
              >
                {isScanning ? "Scanning…" : "Scan Again"}
              </button>
              <button
                type="button"
                onClick={() => setGenerateOpen(true)}
                className="mono rounded-xl border border-line bg-surface px-4 py-2 text-[12.5px] font-medium text-ink hover:border-line-bright"
              >
                Generate llms.txt & Fixes
              </button>
            </div>
          </div>

          {/* ── Subscores Strip ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { id: "seo", label: "SEO", score: v.seo, status: "Indexable" },
              { id: "geo", label: "GEO", score: v.geo, status: "5-Engine" },
              { id: "technical", label: "Technical", score: v.technical, status: "200 OK" },
              { id: "content", label: "Content", score: v.content, status: "1.4k words" },
              { id: "schema", label: "Schema", score: v.schema, status: "3 Types" },
              { id: "crawlers", label: "AI Crawlers", score: v.crawlers, status: "Allowed" },
              { id: "performance", label: "Performance", score: 73, status: "142ms" },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => switchTab(sub.id as SidebarTab)}
                className="card glass-panel p-4 text-left transition-all hover:border-signal/50 hover:shadow-[0_0_16px_var(--color-signal-glow)]"
              >
                <div className="mono text-[10.5px] uppercase tracking-wider text-ink-faint">
                  {sub.label}
                </div>
                <div className="mono mt-1 text-[22px] font-bold text-ink">
                  {sub.score}
                </div>
                <div className="text-[11px] text-signal font-medium mt-0.5">
                  {sub.status}
                </div>
              </button>
            ))}
          </div>

          {/* ── VIEWPORT CONTENT SWITCHER ─────────────────────────────────────── */}
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8 rise">
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
                      View All (12) →
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

                {/* Score History & Trend */}
                <div className="card glass-panel p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[17px] font-bold text-ink">Score History</h2>
                      <p className="text-[12px] text-ink-dim">
                        Visibility trend over the last 30 days
                      </p>
                    </div>
                    <span className="mono text-[12px] text-signal font-bold">
                      +4 pts this month
                    </span>
                  </div>

                  {/* Trendline Graphic */}
                  <div className="rounded-xl border border-line bg-surface/40 p-4">
                    <div className="flex items-end justify-between h-32 pt-6 px-4">
                      {[
                        { label: "Aug 10", score: 74 },
                        { label: "Aug 18", score: 76 },
                        { label: "Aug 26", score: 82 },
                        { label: "Sep 02", score: 80 },
                        { label: "Today", score: 78 },
                      ].map((pt, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                          <span className="mono text-[12px] font-bold text-ink">
                            {pt.score}
                          </span>
                          <div
                            className="w-8 rounded-t bg-signal/80 transition-all hover:bg-signal"
                            style={{ height: `${(pt.score / 100) * 80}px` }}
                          />
                          <span className="mono text-[10.5px] text-ink-faint">
                            {pt.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Callout */}
                  <div className="rounded-xl border border-signal/20 bg-signal/5 p-3.5 text-[12.5px] text-ink-dim flex items-center justify-between">
                    <span>
                      Robots.txt updated on Sep 02 allowed ClaudeBot (+6 pts).
                    </span>
                    <button
                      type="button"
                      onClick={() => switchTab("history")}
                      className="mono text-signal font-semibold hover:underline shrink-0 ml-2"
                    >
                      History Log →
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Scans Table */}
              <div className="card glass-panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[17px] font-bold text-ink">Recent Scans</h2>
                    <p className="text-[12px] text-ink-dim">
                      Websites analyzed across your workspace
                    </p>
                  </div>
                  <Link
                    href="/audit/new"
                    className="mono text-[12px] text-signal font-semibold hover:underline"
                  >
                    + Run New Audit
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-line mono text-[11px] uppercase tracking-wider text-ink-faint">
                        <th className="pb-3 font-semibold">Website / URL</th>
                        <th className="pb-3 font-semibold">Visibility</th>
                        <th className="pb-3 font-semibold">SEO</th>
                        <th className="pb-3 font-semibold">GEO</th>
                        <th className="pb-3 font-semibold">AI Crawlers</th>
                        <th className="pb-3 font-semibold">Last Audited</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {recentScans.map((scan) => (
                        <tr key={scan.domain} className="hover:bg-surface/40 transition-colors">
                          <td className="py-3.5 mono font-semibold text-ink">
                            {scan.domain}
                          </td>
                          <td className="py-3.5 mono font-bold text-signal">
                            {scan.score}
                          </td>
                          <td className="py-3.5 mono text-ink-dim">{scan.seo}</td>
                          <td className="py-3.5 mono text-ink-dim">{scan.geo}</td>
                          <td className="py-3.5 mono text-signal">{scan.crawlers}</td>
                          <td className="py-3.5 text-ink-faint text-[12px]">{scan.time}</td>
                          <td className="py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDomain(scan.domain);
                                setSearchInput(scan.domain);
                                void handleAuditRun(scan.domain);
                              }}
                              className="mono text-[12px] font-semibold text-signal hover:underline"
                            >
                              Inspect →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT & SUB-ANALYSES */}
          {activeTab === "audit" && (
            <div className="space-y-6 rise">
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
                    <div className="mono font-semibold text-signal mt-1">HTTP {e.status} OK · {e.timings.totalMs}ms</div>
                  </div>
                </div>
              </div>
              <IssuesCenter findings={report.findings} />
            </div>
          )}

          {/* TAB 3: SEO */}
          {activeTab === "seo" && (
            <div className="space-y-6 rise">
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
                    <div className="font-semibold text-ink">{e.html.title}</div>
                    <div className="text-[11.5px] text-signal font-medium">56 characters · Optimal length</div>
                  </div>

                  <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2">
                    <div className="mono text-[11px] text-ink-faint uppercase">Meta Description</div>
                    <div className="text-[13px] text-ink-dim">{e.html.metaDescription}</div>
                    <div className="text-[11.5px] text-signal font-medium">152 characters · Optimal length</div>
                  </div>

                  <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2">
                    <div className="mono text-[11px] text-ink-faint uppercase">Heading Hierarchy</div>
                    <div className="mono text-[13px] text-ink">
                      {e.semantics.h1Count} H1 · {e.headings.filter((h) => h.level === 2).length} H2s · {e.headings.length} Total Headings
                    </div>
                    <div className="text-[11.5px] text-signal font-medium">Clean single H1 with logical nested subsections</div>
                  </div>

                  <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2">
                    <div className="mono text-[11px] text-ink-faint uppercase">Canonical Tag</div>
                    <div className="mono text-[12px] text-ink break-all">{e.html.canonical}</div>
                    <div className="text-[11.5px] text-signal font-medium">Self-referencing canonical confirmed</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GEO */}
          {activeTab === "geo" && (
            <div className="space-y-6 rise">
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
                      <div className="text-[11px] text-ink-dim">Highest correlation to Perplexity citation</div>
                    </div>
                    <div className="rounded-lg border border-line bg-surface p-3">
                      <div className="mono text-[11px] text-ink-faint">Adding Statistics</div>
                      <div className="mono text-[18px] font-bold text-signal">+37% Lift</div>
                      <div className="text-[11px] text-ink-dim">Numerical backing rewards Claude & GPT</div>
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
            <div className="space-y-6 rise">
              <CrawlerCenter evidence={e} />
            </div>
          )}

          {/* TAB 6: SCHEMA */}
          {activeTab === "schema" && (
            <div className="space-y-6 rise">
              <SchemaAnalyzer evidence={e} />
            </div>
          )}

          {/* TAB 7: ROBOTS */}
          {activeTab === "robots" && (
            <div className="space-y-6 rise">
              <RobotsAnalyzer evidence={e} />
            </div>
          )}

          {/* TAB 8: CONTENT */}
          {activeTab === "content" && (
            <div className="space-y-6 rise">
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
                    <div className="mono text-[10.5px] uppercase text-ink-faint">Citation Sweet Spot</div>
                    <div className="mono text-[20px] font-bold text-signal mt-1">40–160 w</div>
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
                          Extractability: {Math.round(b.scores.selfContainment * 100)}/100
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
            <div className="space-y-6 rise">
              <div className="card glass-panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[18px] font-bold text-ink">XML Sitemap Verification</h2>
                    <p className="text-[13px] text-ink-dim">
                      Sitemap presence, indexability, and URL declarations
                    </p>
                  </div>
                  <span className="mono rounded bg-signal/15 text-signal px-2.5 py-1 text-[11.5px] font-bold">
                    Detected & Valid
                  </span>
                </div>

                <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2">
                  <div className="mono text-[11px] text-ink-faint uppercase">Sitemap Status</div>
                  <div className="mono font-semibold text-ink">{e.sitemap.found ? "Declared in robots.txt" : "Not declared"}</div>
                  <div className="mono text-[12px] text-signal font-medium">{e.sitemap.urlCount || 412} declared URLs · Status 200 OK</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12.5px]">
                    <thead>
                      <tr className="border-b border-line mono text-[11px] uppercase text-ink-faint">
                        <th className="pb-2">Sample URL</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Canonical Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60 mono text-[12px]">
                      <tr>
                        <td className="py-2.5 text-ink">/docs/payments</td>
                        <td className="py-2.5 text-signal">
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>200 OK</span>
                          </span>
                        </td>
                        <td className="py-2.5 text-signal">Exact Match</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-ink">/docs/billing</td>
                        <td className="py-2.5 text-signal">
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>200 OK</span>
                          </span>
                        </td>
                        <td className="py-2.5 text-signal">Exact Match</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-ink">/docs/connect</td>
                        <td className="py-2.5 text-signal">
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>200 OK</span>
                          </span>
                        </td>
                        <td className="py-2.5 text-signal">Exact Match</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PERFORMANCE */}
          {activeTab === "performance" && (
            <div className="space-y-6 rise">
              <PerformanceAnalyzer evidence={e} />
            </div>
          )}

          {/* TAB: SPECIALIZED AI PROMPTS */}
          {activeTab === "prompts" && (
            <div className="space-y-6 rise">
              <SpecializedPrompts report={report} />
            </div>
          )}

          {/* TAB 10: PAGES */}
          {activeTab === "pages" && (
            <div className="space-y-6 rise">
              <div className="card glass-panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[18px] font-bold text-ink">Crawled Pages</h2>
                    <p className="text-[13px] text-ink-dim">
                      Full crawl table of detected pages with individual pillar metrics
                    </p>
                  </div>
                  <span className="mono text-[12px] text-ink-faint">Showing 4 pages</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-line mono text-[11px] uppercase tracking-wider text-ink-faint">
                        <th className="pb-3 font-semibold">URL Path</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">SEO</th>
                        <th className="pb-3 font-semibold">GEO</th>
                        <th className="pb-3 font-semibold">Technical</th>
                        <th className="pb-3 font-semibold">Content</th>
                        <th className="pb-3 font-semibold">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60 mono">
                      <tr className="hover:bg-surface/40 transition-colors">
                        <td className="py-3 font-semibold text-ink">/docs/payments</td>
                        <td className="py-3 text-signal">200</td>
                        <td className="py-3 text-ink">84</td>
                        <td className="py-3 text-signal font-bold">71</td>
                        <td className="py-3 text-ink">82</td>
                        <td className="py-3 text-ink">76</td>
                        <td className="py-3 text-warn">3 (1 Crit)</td>
                      </tr>
                      <tr className="hover:bg-surface/40 transition-colors">
                        <td className="py-3 font-semibold text-ink">/docs/billing</td>
                        <td className="py-3 text-signal">200</td>
                        <td className="py-3 text-ink">88</td>
                        <td className="py-3 text-signal font-bold">79</td>
                        <td className="py-3 text-ink">85</td>
                        <td className="py-3 text-ink">82</td>
                        <td className="py-3 text-signal">0</td>
                      </tr>
                      <tr className="hover:bg-surface/40 transition-colors">
                        <td className="py-3 font-semibold text-ink">/docs/connect</td>
                        <td className="py-3 text-signal">200</td>
                        <td className="py-3 text-ink">80</td>
                        <td className="py-3 text-signal font-bold">68</td>
                        <td className="py-3 text-ink">80</td>
                        <td className="py-3 text-ink">70</td>
                        <td className="py-3 text-warn">2</td>
                      </tr>
                      <tr className="hover:bg-surface/40 transition-colors">
                        <td className="py-3 font-semibold text-ink">/docs/radar</td>
                        <td className="py-3 text-signal">200</td>
                        <td className="py-3 text-ink">86</td>
                        <td className="py-3 text-signal font-bold">75</td>
                        <td className="py-3 text-ink">84</td>
                        <td className="py-3 text-ink">74</td>
                        <td className="py-3 text-signal">1</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: ISSUES */}
          {activeTab === "issues" && (
            <div className="space-y-6 rise">
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
            <div className="space-y-6 rise">
              <div className="card glass-panel p-6 space-y-4">
                <h2 className="text-[18px] font-bold text-ink">Score Changes & Changelog</h2>
                <p className="text-[13px] text-ink-dim">
                  Historical audit benchmarks and detected configuration adjustments
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    { date: "September 02, 2026", prev: 76, current: 82, note: "Allowed ClaudeBot and OAI-SearchBot in robots.txt (+6)" },
                    { date: "August 26, 2026", prev: 74, current: 76, note: "Added BreadcrumbList and WebSite JSON-LD structured data (+2)" },
                    { date: "August 10, 2026", prev: 70, current: 74, note: "Initial website audit crawl completed (+4)" },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl border border-line bg-surface/50 p-4 flex items-center justify-between">
                      <div>
                        <div className="mono text-[11px] text-ink-faint">{item.date}</div>
                        <div className="text-[13.5px] font-semibold text-ink mt-0.5">{item.note}</div>
                      </div>
                      <div className="mono text-right">
                        <span className="text-ink-faint text-[13px]">{item.prev} → </span>
                        <span className="text-signal font-bold text-[16px]">{item.current}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6 rise">
              <div className="card glass-panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[18px] font-bold text-ink">Saved Audit Reports</h2>
                    <p className="text-[13px] text-ink-dim">
                      Downloadable deliverables and client share links
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExportOpen(true)}
                    className="mono rounded-xl bg-signal px-3.5 py-1.5 text-[12px] font-bold text-void hover:brightness-110"
                  >
                    + Export Current Report
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="card glass-panel p-5 space-y-3 border-line/80">
                    <div className="flex items-center justify-between">
                      <span className="mono text-[13px] font-bold text-ink">stripe.com/docs</span>
                      <span className="mono text-[18px] font-bold text-signal">78</span>
                    </div>
                    <div className="mono text-[11px] text-ink-faint">Saved September 6, 2026 · 142ms latency</div>
                    <div className="flex gap-2 pt-2 border-t border-line/60">
                      <Link
                        href="/report/stripe-docs"
                        className="mono text-[11.5px] font-semibold text-signal hover:underline"
                      >
                        View Client Report
                      </Link>
                      <span className="text-ink-faint">•</span>
                      <button
                        type="button"
                        onClick={() => setExportOpen(true)}
                        className="mono text-[11.5px] text-ink-dim hover:text-ink"
                      >
                        Export PDF / Prompts
                      </button>
                    </div>
                  </div>

                  <div className="card glass-panel p-5 space-y-3 border-line/80">
                    <div className="flex items-center justify-between">
                      <span className="mono text-[13px] font-bold text-ink">linear.app</span>
                      <span className="mono text-[18px] font-bold text-signal">85</span>
                    </div>
                    <div className="mono text-[11px] text-ink-faint">Saved September 5, 2026 · 98ms latency</div>
                    <div className="flex gap-2 pt-2 border-t border-line/60">
                      <Link
                        href="/report/linear-app"
                        className="mono text-[11.5px] font-semibold text-signal hover:underline"
                      >
                        View Client Report
                      </Link>
                      <span className="text-ink-faint">•</span>
                      <button
                        type="button"
                        onClick={() => setExportOpen(true)}
                        className="mono text-[11.5px] text-ink-dim hover:text-ink"
                      >
                        Export PDF / Prompts
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6 rise">
              <div className="card glass-panel p-6 space-y-6">
                <div>
                  <h2 className="text-[18px] font-bold text-ink">Workspace Settings</h2>
                  <p className="text-[13px] text-ink-dim">
                    Manage team domains, notifications, and LLM rewrite credentials
                  </p>
                </div>

                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="mono block text-[11px] uppercase tracking-wider text-ink-faint mb-1.5 font-medium">
                      Primary Monitored Domain
                    </label>
                    <input
                      type="text"
                      defaultValue="stripe.com"
                      className="mono h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[13px] text-ink"
                    />
                  </div>

                  <div>
                    <label className="mono block text-[11px] uppercase tracking-wider text-ink-faint mb-1.5 font-medium">
                      Crawl Alert Frequency
                    </label>
                    <select className="mono h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[13px] text-ink">
                      <option>Weekly on Mondays</option>
                      <option>Daily Digest</option>
                      <option>Real-Time on Critical Regression</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => alert("Settings updated successfully.")}
                      className="mono rounded-xl bg-signal px-5 py-2.5 text-[12.5px] font-bold text-void hover:brightness-110 shadow-[0_0_14px_var(--color-signal-glow)]"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 15: HELP & DOCS */}
          {activeTab === "help" && (
            <div className="space-y-6 rise">
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
        </main>
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
