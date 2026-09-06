"use client";

import { useState } from "react";
import type { Evidence } from "@/lib/types";
import { Pill } from "./primitives";
import { AlertTriangle, Copy, Check } from "lucide-react";

const STANDARD_SCHEMAS = [
  { type: "Organization", label: "Organization", purpose: "Entity authority, logo, sameAs profiles" },
  { type: "WebSite", label: "WebSite", purpose: "Site search, core identity" },
  { type: "WebPage", label: "WebPage", purpose: "Page metadata, author, dateModified" },
  { type: "Article", label: "Article / BlogPosting", purpose: "Editorial byline, freshness timestamps" },
  { type: "FAQPage", label: "FAQPage", purpose: "Question & answer pairs for search snippets" },
  { type: "BreadcrumbList", label: "BreadcrumbList", purpose: "Site structure & navigation hierarchy" },
  { type: "Product", label: "Product / Service", purpose: "Offers, pricing, review markup" },
];

export function SchemaAnalyzer({ evidence }: { evidence: Evidence }) {
  const [selectedSnippet, setSelectedSnippet] = useState(0);
  const [copied, setCopied] = useState(false);

  const detected = evidence.schemaAnalysis?.detectedTypes ?? [];
  const issues = evidence.schemaAnalysis?.issues ?? [];
  const snippets = evidence.schemaAnalysis?.rawSnippets ?? [];

  function copyJson() {
    if (!snippets[selectedSnippet]) return;
    void navigator.clipboard.writeText(snippets[selectedSnippet]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
            JSON-LD Blocks
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-signal">
              {snippets.length}
            </span>
            <span className="text-[13px] text-ink-dim">blocks detected</span>
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">
            Structured data parsed from application/ld+json scripts.
          </p>
        </div>

        <div className="card p-4">
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
            Schema Entity Types
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-ink">
              {detected.length}
            </span>
            <span className="text-[13px] text-ink-dim">types declared</span>
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">
            {detected.length > 0 ? detected.slice(0, 3).join(", ") : "No structured types"}
          </p>
        </div>

        <div className="card p-4">
          <span className="mono text-[11px] uppercase tracking-wider text-ink-faint">
            Validation Status
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                issues.length === 0 ? "bg-signal" : "bg-warn"
              }`}
            />
            <span className="text-[18px] font-medium text-ink">
              {issues.length === 0 ? "Clean Schema" : `${issues.length} Issues Found`}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">
            {issues.length === 0
              ? "All declared entity properties conform to best practices."
              : "Recommended properties or entity connections missing."}
          </p>
        </div>
      </div>

      {/* Schema Checklist Matrix */}
      <div className="card p-5">
        <h3 className="text-[15px] font-semibold text-ink">Recommended Entity Checklist</h3>
        <p className="mt-1 text-[12px] text-ink-faint">
          Search engines and generative answer engines use structured entities to corroborate facts, authorship, and entity knowledge.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {STANDARD_SCHEMAS.map((item) => {
            const isPresent = detected.some((t) =>
              new RegExp(item.type, "i").test(t),
            );
            return (
              <div
                key={item.type}
                className="flex items-center justify-between rounded-lg border border-line bg-surface/50 p-3"
              >
                <div>
                  <span className="mono font-semibold text-[13px] text-ink">
                    {item.label}
                  </span>
                  <span className="block text-[11.5px] text-ink-faint">
                    {item.purpose}
                  </span>
                </div>
                {isPresent ? (
                  <Pill fg="var(--color-signal)" bg="rgba(59,244,138,0.12)">
                    Detected
                  </Pill>
                ) : (
                  <Pill fg="var(--color-ink-faint)" bg="rgba(107,116,130,0.14)">
                    Missing
                  </Pill>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Warnings */}
      {issues.length > 0 && (
        <div className="rounded-xl border border-warn/30 bg-warn/5 p-4">
          <h4 className="flex items-center gap-2 text-[13.5px] font-semibold text-warn">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Schema Recommendations</span>
          </h4>
          <ul className="mt-2.5 space-y-1.5 text-[12.5px] text-ink-dim">
            {issues.map((iss, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-warn">•</span>
                <span>{iss}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Formatted JSON-LD Viewer */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between border-b border-line bg-surface/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="mono text-[12px] font-semibold text-ink">JSON-LD Inspector</span>
            {snippets.length > 1 && (
              <div className="flex gap-1 ml-3">
                {snippets.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSnippet(idx)}
                    className={`mono rounded px-2 py-0.5 text-[11px] ${
                      selectedSnippet === idx
                        ? "bg-signal text-void font-bold"
                        : "bg-surface text-ink-faint hover:text-ink"
                    }`}
                  >
                    Block #{idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          {snippets.length > 0 && (
            <button
              type="button"
              onClick={copyJson}
              className="mono inline-flex items-center gap-1.5 rounded border border-line bg-surface px-3 py-1 text-[11px] text-ink-dim transition-colors hover:border-line-bright hover:text-ink"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-signal" />
                  <span>Copied JSON</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy JSON-LD</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="p-4">
          {snippets.length > 0 ? (
            <pre className="mono thin-scroll max-h-96 overflow-auto rounded-lg bg-base p-3 text-[11.5px] leading-relaxed text-ink-dim">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(snippets[selectedSnippet]), null, 2);
                } catch {
                  return snippets[selectedSnippet];
                }
              })()}
            </pre>
          ) : (
            <div className="py-8 text-center text-[13px] text-ink-faint">
              No JSON-LD blocks found on this page. Use the file generator to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
