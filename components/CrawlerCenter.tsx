"use client";

import { useState } from "react";
import type { Evidence } from "@/lib/types";
import { AI_AGENTS } from "@/lib/robots";
import { Pill } from "./primitives";

export function CrawlerCenter({ evidence }: { evidence: Evidence }) {
  const [filter, setFilter] = useState<"all" | "search" | "training" | "browsing">("all");

  const rules = evidence.robots.rules;
  const list = AI_AGENTS.filter((a) => (filter === "all" ? true : a.crawlerType === filter));

  const totalSearch = AI_AGENTS.filter((a) => a.crawlerType === "search");
  const allowedSearch = totalSearch.filter((a) => rules[a.agent]?.allowed).length;

  const totalTraining = AI_AGENTS.filter((a) => a.crawlerType === "training");
  const blockedTraining = totalTraining.filter((a) => !rules[a.agent]?.allowed).length;

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
            AI Search Indexing
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-signal">
              {allowedSearch}/{totalSearch.length}
            </span>
            <span className="text-[13px] text-ink-dim">crawlers allowed</span>
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">
            Powers direct citations in ChatGPT, Perplexity, Claude, Copilot, & Google.
          </p>
        </div>

        <div className="card p-4">
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
            Training Scrapers
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-ink">
              {blockedTraining}/{totalTraining.length}
            </span>
            <span className="text-[13px] text-ink-dim">crawlers blocked</span>
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">
            Training crawlers (CCBot, GPTBot) can be blocked without losing citation readiness.
          </p>
        </div>

        <div className="card p-4">
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
            Robots.txt Status
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                evidence.robots.found ? "bg-signal" : "bg-warn"
              }`}
            />
            <span className="text-[18px] font-medium text-ink">
              {evidence.robots.found ? "Active File" : "No File Found"}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">
            {evidence.robots.found
              ? `${evidence.robots.explainedRules.length} explicit rules analyzed`
              : "Without robots.txt, all AI crawlers have full default access."}
          </p>
        </div>
      </div>

      {/* Pro Strategy Callout */}
      <div className="rounded-xl border border-line bg-surface/40 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal/15 text-[11px] font-bold text-signal">
            i
          </span>
          <div className="text-[13px] leading-relaxed text-ink-dim">
            <strong className="text-ink">Search vs. Training crawler separation:</strong> Providers
            like OpenAI separate search indexing (<code className="mono text-signal">OAI-SearchBot</code>)
            from general model training (<code className="mono text-ink">GPTBot</code>). You can
            disallow training scrapers in your <code className="mono text-ink">robots.txt</code> without
            harming your presence in AI-generated answers.
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-1.5">
          {(
            [
              ["all", "All Agents"],
              ["search", "Search & Citations"],
              ["training", "Training Crawlers"],
              ["browsing", "Live Fetch"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilter(val)}
              className={`mono rounded-md px-3 py-1 text-[12px] transition-colors ${
                filter === val
                  ? "bg-signal text-void font-semibold"
                  : "bg-surface text-ink-dim hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="mono text-[11px] text-ink-faint">
          Showing {list.length} user agents
        </span>
      </div>

      {/* Crawler Table */}
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-line bg-surface/80 text-[11px] uppercase tracking-wider text-ink-faint">
            <tr>
              <th className="px-4 py-3">Crawler</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Role & Purpose</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Rule Matched</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((spec) => {
              const rule = rules[spec.agent];
              const allowed = rule ? rule.allowed : true;
              return (
                <tr key={spec.agent} className="transition-colors hover:bg-surface/60">
                  <td className="px-4 py-3.5 font-medium text-ink">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          allowed ? "bg-signal" : "bg-danger"
                        }`}
                      />
                      <span className="mono font-semibold">{spec.agent}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-ink-faint">
                    <span className="mono rounded bg-raised px-2 py-0.5 text-[11px]">
                      {spec.crawlerType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-ink-dim">{spec.role}</td>
                  <td className="px-4 py-3.5">
                    {allowed ? (
                      <Pill fg="var(--color-signal)" bg="rgba(59,244,138,0.12)">
                        Allowed
                      </Pill>
                    ) : (
                      <Pill fg="var(--color-danger)" bg="rgba(255,107,94,0.14)">
                        Blocked
                      </Pill>
                    )}
                  </td>
                  <td className="mono px-4 py-3.5 text-[12px] text-ink-faint">
                    {rule?.matchedLine || (evidence.robots.found ? "Allow (default)" : "No robots.txt")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
