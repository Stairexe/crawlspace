"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Link2, Search, Trash2, Unlink } from "lucide-react";
import type { AuditReport, SavedAuditSummary } from "@/lib/types";
import { ENGINES, ENGINE_SHORT } from "@/lib/types";
import { useSession } from "./useSession";
import { forgetGuestAudit, guestHistory } from "./guestHistory";
import { ScoreTrend } from "./ScoreTrend";

function when(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  if (mins < 60 * 24 * 7) return `${Math.round(mins / 1440)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return u.host + (u.pathname === "/" ? "" : u.pathname.replace(/\/$/, ""));
  } catch {
    return url;
  }
}

function tone(score: number): string {
  if (score >= 70) return "text-good";
  if (score >= 45) return "text-warn";
  return "text-danger";
}

/**
 * Audit history. Signed in: rows from the server (saved by /api/audit). Guests: the last
 * audits kept in this browser. `mode="shared"` lists only audits with a public link.
 */
export function HistoryPanel({
  onOpen,
  mode = "all",
  focusUrl,
}: {
  onOpen: (report: AuditReport) => void;
  mode?: "all" | "shared";
  /** Pre-selects this page's trend (the report on screen). */
  focusUrl?: string;
}) {
  const session = useSession();
  const [rows, setRows] = useState<SavedAuditSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const signedIn = !!session.user;

  const load = useCallback(async () => {
    setError(null);
    if (!session.user) {
      setRows(guestHistory().map((g) => g.summary));
      return;
    }
    try {
      const res = await fetch("/api/audits", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load your history.");
      setRows(json.audits as SavedAuditSummary[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your history.");
      setRows([]);
    }
  }, [session.user]);

  useEffect(() => {
    if (!session.loading) void load();
  }, [session.loading, load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? [])
      .filter((r) => (mode === "shared" ? !!r.shareId : true))
      .filter((r) => !q || r.url.toLowerCase().includes(q) || (r.title ?? "").toLowerCase().includes(q));
  }, [rows, query, mode]);

  // Pages with at least two audits can show a trend.
  const pages = useMemo(() => {
    const m = new Map<string, SavedAuditSummary[]>();
    for (const r of rows ?? []) {
      const k = pathOf(r.url);
      m.set(k, [...(m.get(k) ?? []), r]);
    }
    return m;
  }, [rows]);
  const trendKey =
    selected ??
    (focusUrl && pages.has(pathOf(focusUrl)) ? pathOf(focusUrl) : [...pages.entries()].find(([, v]) => v.length > 1)?.[0] ?? null);
  const trendRows = trendKey ? [...(pages.get(trendKey) ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : [];

  async function open(row: SavedAuditSummary) {
    setBusy(row.id);
    try {
      if (!signedIn) {
        const g = guestHistory().find((e) => e.summary.id === row.id);
        if (g) onOpen(g.report);
        return;
      }
      const res = await fetch(`/api/audits/${row.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not open that audit.");
      onOpen((json as { report: AuditReport }).report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open that audit.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(row: SavedAuditSummary) {
    if (!window.confirm(`Delete the audit of ${pathOf(row.url)}?`)) return;
    if (!signedIn) {
      forgetGuestAudit(row.id);
      void load();
      return;
    }
    setBusy(row.id);
    const res = await fetch(`/api/audits/${row.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) setRows((rs) => (rs ?? []).filter((r) => r.id !== row.id));
    else setError("Could not delete that audit.");
  }

  async function share(row: SavedAuditSummary, on: boolean) {
    setBusy(row.id);
    try {
      const res = await fetch(`/api/audits/${row.id}/share`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ on }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not change the link.");
      const shareId = (json.shareId as string | null) ?? undefined;
      setRows((rs) => (rs ?? []).map((r) => (r.id === row.id ? { ...r, shareId } : r)));
      if (shareId) {
        const link = `${window.location.origin}/report/${shareId}`;
        await navigator.clipboard?.writeText(link).catch(() => undefined);
        setCopied(row.id);
        setTimeout(() => setCopied(null), 1800);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change the link.");
    } finally {
      setBusy(null);
    }
  }

  if (session.loading || rows === null) {
    return <div className="card h-64 animate-pulse" aria-busy="true" />;
  }

  const avg = visible.length ? Math.round(visible.reduce((n, r) => n + r.composite, 0) / visible.length) : 0;

  return (
    <div className="space-y-5">
      {/* Who and where */}
      {!signedIn && (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13.5px] leading-relaxed text-ink-dim">
            {session.accounts
              ? "These audits are kept in this browser only. Create a free account to keep them everywhere and share them."
              : "These audits are kept in this browser only."}
          </p>
          {session.accounts && (
            <div className="flex shrink-0 gap-2">
              <Link href="/login?next=/dashboard?tab=history" className="btn-quiet !py-1.5 !text-[13px]">
                Log in
              </Link>
              <Link href="/signup?next=/dashboard?tab=history" className="btn-primary !py-1.5 !text-[13px]">
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-4">
        {[
          [mode === "shared" ? "Shared audits" : "Audits", String(visible.length)],
          ["Pages", String(new Set(visible.map((r) => pathOf(r.url))).size)],
          ["Average composite", visible.length ? String(avg) : "—"],
          ["Last audit", visible[0] ? when(visible[0].createdAt) : "—"],
        ].map(([k, v], i) => (
          <div key={k} className={`px-4 py-3 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""} border-line`}>
            <div className="tb-label">{k}</div>
            <div className="num mt-1 text-[20px] text-ink">{v}</div>
          </div>
        ))}
      </div>

      {/* Trend */}
      {mode === "all" && trendRows.length > 1 && trendKey && (
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="tb-label">Score trend</div>
              <div className="mono mt-1 text-[14px] text-ink">{trendKey}</div>
            </div>
            <select
              aria-label="Page"
              value={trendKey}
              onChange={(e) => setSelected(e.target.value)}
              className="field !h-8 !w-auto max-w-[260px] !text-[12.5px]"
            >
              {[...pages.entries()]
                .filter(([, v]) => v.length > 1)
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {k} ({v.length})
                  </option>
                ))}
            </select>
          </div>
          <ScoreTrend rows={trendRows} />
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <Search className="h-4 w-4 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by URL or title"
            aria-label="Filter audits"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-faint/70"
          />
        </div>
        {error && (
          <p role="alert" className="border-b border-line bg-tint-bad px-4 py-2 text-[13px] text-danger">
            {error}
          </p>
        )}
        {visible.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-[15px] text-ink">
              {mode === "shared" ? "No shared audits yet." : rows.length ? "Nothing matches that filter." : "No audits yet."}
            </p>
            <p className="mt-1 text-[13.5px] text-ink-dim">
              {mode === "shared"
                ? signedIn
                  ? "Use “Share” on any audit in History to make a read-only link."
                  : "Share links need an account."
                : "Run an audit and it will appear here."}
            </p>
            <Link href="/" className="btn-primary mt-5">
              Run an audit
            </Link>
          </div>
        ) : (
          <ul>
            {visible.map((r) => (
              <li key={r.id} className="grid gap-3 border-b border-line px-4 py-3.5 last:border-b-0 md:grid-cols-[1fr_auto_auto] md:items-center">
                <button type="button" onClick={() => void open(r)} className="min-w-0 text-left" disabled={busy === r.id}>
                  <div className="mono truncate text-[13.5px] text-ink hover:text-signal">{pathOf(r.url)}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-faint">
                    <span>{when(r.createdAt)}</span>
                    <span>{r.findings} findings</span>
                    {r.critical > 0 && <span className="text-danger">{r.critical} critical</span>}
                    {r.gated > 0 && <span className="rounded bg-tint-bad px-1.5 text-danger">{r.gated} gated</span>}
                    {r.shareId && <span className="rounded bg-wash px-1.5 text-signal">shared</span>}
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <div className="hidden gap-1 sm:flex" aria-label="Engine scores">
                    {ENGINES.map((e) => (
                      <div key={e} className="w-8 text-center" title={`${ENGINE_SHORT[e]} ${r.engines[e]}`}>
                        <div className="mono text-[9.5px] text-ink-faint">{ENGINE_SHORT[e]}</div>
                        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-raised">
                          <div className="h-full rounded-full bg-signal" style={{ width: `${r.engines[e]}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className={`num w-10 text-right text-[18px] ${tone(r.composite)}`}>{r.composite}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => void open(r)} className="btn-ghost !px-2.5 !py-1.5 !text-[13px]" disabled={busy === r.id}>
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </button>
                  {signedIn &&
                    (r.shareId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(`${window.location.origin}/report/${r.shareId}`);
                            setCopied(r.id);
                            setTimeout(() => setCopied(null), 1800);
                          }}
                          className="btn-ghost !px-2.5 !py-1.5 !text-[13px] !text-signal"
                        >
                          {copied === r.id ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                          {copied === r.id ? "Copied" : "Copy link"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void share(r, false)}
                          aria-label="Remove share link"
                          title="Remove share link"
                          className="btn-ghost !px-2 !py-1.5"
                          disabled={busy === r.id}
                        >
                          <Unlink className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => void share(r, true)} className="btn-ghost !px-2.5 !py-1.5 !text-[13px]" disabled={busy === r.id}>
                        {copied === r.id ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                        {copied === r.id ? "Link copied" : "Share"}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => void remove(r)}
                    aria-label="Delete audit"
                    title="Delete"
                    className="btn-ghost !px-2 !py-1.5 hover:!text-danger"
                    disabled={busy === r.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
