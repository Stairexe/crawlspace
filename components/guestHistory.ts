"use client";

import type { AuditReport, SavedAuditSummary } from "@/lib/types";
import { summarise } from "@/lib/auditSummary";

/**
 * History for visitors without an account: the last audits, kept in this browser's
 * localStorage. Nothing is sent anywhere. Signed-in audits are saved server-side instead.
 */

const KEY = "crawlspace:guest-history";
const MAX = 12;

export interface GuestEntry {
  summary: SavedAuditSummary;
  report: AuditReport;
}

export function guestHistory(): GuestEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuestEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: GuestEntry[]): void {
  // Reports can be large; drop the oldest until it fits the browser's quota.
  let list = entries.slice(0, MAX);
  while (list.length) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return;
    } catch {
      list = list.slice(0, -1);
    }
  }
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Records an audit for guests. Signed-in audits (with savedId) live on the server. */
export function rememberAudit(report: AuditReport): void {
  if (report.savedId) return;
  const id = `g${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
  write([{ summary: summarise(id, report), report }, ...guestHistory()]);
}

export function forgetGuestAudit(id: string): void {
  write(guestHistory().filter((e) => e.summary.id !== id));
}

export function clearGuestHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
