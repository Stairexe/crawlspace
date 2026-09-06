"use client";

import { useState } from "react";
import type { Evidence } from "@/lib/types";
import { Pill } from "./primitives";
import { Check, Copy, X } from "lucide-react";

export function RobotsAnalyzer({ evidence }: { evidence: Evidence }) {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const robots = evidence.robots;
  const explained = robots.explainedRules;

  function copyRaw() {
    if (!robots.rawText) return;
    void navigator.clipboard.writeText(robots.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
            File Status
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                robots.found ? "bg-signal" : "bg-warn"
              }`}
            />
            <span className="text-[18px] font-semibold text-ink">
              {robots.found ? "Detected" : "Not Found"}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">
            {robots.status ? `HTTP ${robots.status} on /robots.txt` : "No response"}
          </p>
        </div>

        <div className="card p-4">
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
            Rules Parsed
          </span>
          <div className="mt-1 text-[24px] font-semibold text-ink">
            {explained.length}
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">Directives analyzed</p>
        </div>

        <div className="card p-4">
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
            Sitemap Declared
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                evidence.sitemap.inRobots ? "bg-signal" : "bg-warn"
              }`}
            />
            <span className="text-[18px] font-semibold text-ink">
              {evidence.sitemap.inRobots ? "Linked" : "Missing Link"}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">
            {evidence.sitemap.inRobots
              ? "Sitemap URL declared in robots.txt"
              : "Add 'Sitemap: https://domain/sitemap.xml'"}
          </p>
        </div>

        <div className="card p-4">
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
            Index Directives
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                !robots.metaRobots && !robots.xRobotsTag ? "bg-signal" : "bg-warn"
              }`}
            />
            <span className="text-[18px] font-semibold text-ink">
              {robots.metaRobots ? "Meta Tagged" : "Standard"}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">
            {robots.metaRobots || robots.xRobotsTag || "No noindex restrictions found"}
          </p>
        </div>
      </div>

      {/* Explained Rules Section */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-surface/80 px-4 py-3">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">
              Plain-English Rule Explanations
            </h3>
            <p className="text-[11.5px] text-ink-faint">
              What your robots.txt file actually tells crawlers to do.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRaw((s) => !s)}
              className="mono rounded border border-line bg-surface px-3 py-1 text-[11px] text-ink-dim transition-colors hover:border-line-bright hover:text-ink"
            >
              {showRaw ? "Show Explained" : "View Raw File"}
            </button>
            {robots.rawText && (
              <button
                type="button"
                onClick={copyRaw}
                className="mono inline-flex items-center gap-1 rounded border border-line bg-surface px-3 py-1 text-[11px] text-ink-dim transition-colors hover:border-line-bright hover:text-ink"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-signal" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Raw</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {showRaw ? (
            <pre className="mono thin-scroll max-h-96 overflow-auto rounded-lg bg-base p-3 text-[11.5px] leading-relaxed text-ink-dim">
              {robots.rawText || "// No robots.txt found."}
            </pre>
          ) : explained.length > 0 ? (
            <div className="space-y-3">
              {explained.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded-lg border border-line bg-surface/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                        rule.allowed
                          ? "bg-signal/15 text-signal font-bold"
                          : "bg-danger/15 text-danger font-bold"
                      }`}
                    >
                      {rule.allowed ? (
                        <Check className="h-2.5 w-2.5 text-signal" />
                      ) : (
                        <X className="h-2.5 w-2.5 text-danger" />
                      )}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="mono font-semibold text-[13px] text-ink">
                          {rule.directive}
                        </span>
                        <span className="mono rounded bg-raised px-1.5 py-0.5 text-[10.5px] text-ink-faint">
                          User-agent: {rule.agent}
                        </span>
                      </div>
                      <p className="mt-1 text-[12.5px] text-ink-dim">
                        {rule.explanation}
                      </p>
                    </div>
                  </div>
                  <div>
                    {rule.allowed ? (
                      <Pill fg="var(--color-signal)" bg="rgba(59,244,138,0.12)">
                        Allow
                      </Pill>
                    ) : (
                      <Pill fg="var(--color-danger)" bg="rgba(255,107,94,0.14)">
                        Disallow
                      </Pill>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[13px] text-ink-faint">
              {robots.found
                ? "No explicit Disallow or Allow directives found in this robots.txt file."
                : "No robots.txt file was detected. All search and AI crawlers are permitted by default."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
