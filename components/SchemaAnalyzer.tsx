"use client";

import { useState } from "react";
import type { Evidence } from "@/lib/types";
import { Pill } from "./primitives";
import { AlertTriangle, Copy, Check } from "lucide-react";

// `match` covers every type named in `label`, using the same patterns as lib/extract.ts and
// lib/scoring/score.ts, so "Detected" here agrees with detectedTypes and the schema score.
const STANDARD_SCHEMAS = [
  { type: "Organization", label: "Organization", match: /Organization|Corporation/i, purpose: "Entity authority, logo, sameAs profiles" },
  { type: "WebSite", label: "WebSite", match: /WebSite/i, purpose: "Site search, core identity" },
  { type: "WebPage", label: "WebPage", match: /WebPage/i, purpose: "Page metadata, author, dateModified" },
  { type: "Article", label: "Article / BlogPosting", match: /Article|BlogPosting/i, purpose: "Editorial byline, freshness timestamps" },
  { type: "FAQPage", label: "FAQPage", match: /FAQPage/i, purpose: "Question & answer pairs for search snippets" },
  { type: "BreadcrumbList", label: "BreadcrumbList", match: /BreadcrumbList/i, purpose: "Site structure & navigation hierarchy" },
  { type: "Product", label: "Product / Service", match: /Product|Service/i, purpose: "Offers, pricing, review markup" },
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
              {issues.length === 0
                ? "No issues found"
                : `${issues.length} ${issues.length === 1 ? "Issue" : "Issues"} Found`}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">
            {issues.length === 0
              ? "In the checks Crawlspace runs: Organization present with sameAs and logo; page schema (if any) has a date and an author."
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
            const isPresent = detected.some((t) => item.match.test(t));
            return (
              <div
                key={item.type}
                className="flex items-center justify-between rounded-[3px] border border-line bg-surface/50 p-3"
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
                  <Pill fg="var(--color-signal)" bg="var(--color-tint-good)">
                    Detected
                  </Pill>
                ) : (
                  <Pill fg="var(--color-ink-faint)" bg="var(--color-tint-neutral)">
                    Missing
                  </Pill>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <EntityPanel evidence={evidence} />

      {/* Validation Warnings */}
      {issues.length > 0 && (
        <div className="rounded-[3px] border border-warn/30 bg-warn/5 p-4">
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
            <pre tabIndex={0} className="mono thin-scroll max-h-96 overflow-auto rounded-[3px] bg-base p-3 text-[11.5px] leading-relaxed text-ink-dim">
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

/** What the open knowledge graph knows about the domain, and whether the page links it. */
function EntityPanel({ evidence }: { evidence: Evidence }) {
  const en = evidence.entity;
  if (!en) return null;
  const profiles = en.sameAs.filter((u) => !/wikidata\.org|wikipedia\.org/i.test(u));
  let status: { text: string; tone: string };
  if (en.platform) status = { text: "Not scored — shared platform", tone: "text-ink-faint" };
  else if (!en.checked) status = { text: "Not scored — Wikidata did not answer", tone: "text-ink-faint" };
  else if (en.wikidata && en.linkedFromPage) status = { text: "Known entity, linked both ways", tone: "text-good" };
  else if (en.wikidata) status = { text: "Known entity, not linked from the page", tone: "text-warn" };
  else status = { text: "Not in Wikidata", tone: "text-warn" };

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-ink">Knowledge graph</h3>
        <span className={`mono text-[12px] ${status.tone}`}>{status.text}</span>
      </div>
      <p className="mt-1 text-[12px] text-ink-faint">
        Looked up by domain ({en.platform ?? en.domain}) through Wikidata&apos;s official-website
        property, never by name.
      </p>
      <dl className="mt-4 divide-y divide-line border-y border-line text-[13px]">
        <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5">
          <dt className="text-ink-faint">Wikidata item</dt>
          <dd className="min-w-0 text-ink">
            {en.wikidata ? (
              <>
                <a href={en.wikidata.url} target="_blank" rel="noreferrer" className="mono underline underline-offset-4">
                  {en.wikidata.id}
                </a>{" "}
                {en.wikidata.label}
                {en.wikidata.description && <span className="text-ink-faint"> — {en.wikidata.description}</span>}
              </>
            ) : (
              <span className="text-ink-faint">{en.checked ? "None names this domain" : "—"}</span>
            )}
          </dd>
        </div>
        <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5">
          <dt className="text-ink-faint">Wikipedia (en)</dt>
          <dd className="min-w-0 break-words text-ink">
            {en.wikipedia ? (
              <a href={en.wikipedia} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                {decodeURIComponent(en.wikipedia.split("/wiki/")[1] ?? en.wikipedia).replace(/_/g, " ")}
              </a>
            ) : (
              <span className="text-ink-faint">—</span>
            )}
          </dd>
        </div>
        <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5">
          <dt className="text-ink-faint">sameAs on the page</dt>
          <dd className="min-w-0 text-ink">
            {en.sameAs.length === 0 ? (
              <span className="text-ink-faint">None declared</span>
            ) : (
              <ul className="space-y-1">
                {en.sameAs.slice(0, 8).map((u) => (
                  <li key={u} className="mono break-all text-[12px] text-ink-dim">
                    {u}
                  </li>
                ))}
                {en.sameAs.length > 8 && <li className="text-[12px] text-ink-faint">and {en.sameAs.length - 8} more</li>}
              </ul>
            )}
          </dd>
        </div>
      </dl>
      {profiles.length === 0 && en.sameAs.length === 0 && (
        <p className="mt-3 text-[12px] text-ink-faint">
          sameAs is the list of your profiles elsewhere — LinkedIn, GitHub, Crunchbase — inside
          the Organization schema. It is what lets a machine tie this domain to the same brand.
        </p>
      )}
    </div>
  );
}
