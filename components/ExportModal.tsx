"use client";

import { useState } from "react";
import type { AuditReport } from "@/lib/types";
import { download, reportToJson, reportToLLMPrompt, reportToMarkdown, safeFilename } from "@/lib/export";
import { Check, Copy, FileDown, X } from "lucide-react";

export function ExportModal({
  report,
  isOpen,
  onClose,
}: {
  report: AuditReport;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [activePreview, setActivePreview] = useState<"prompt" | "markdown" | "json">("prompt");

  if (!isOpen) return null;

  const baseName = safeFilename(report.evidence.finalUrl);
  const llmPrompt = reportToLLMPrompt(report);
  const markdownReport = reportToMarkdown(report);
  const jsonReport = reportToJson(report);

  function copyPrompt() {
    void navigator.clipboard.writeText(llmPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }

  function copyMarkdown() {
    void navigator.clipboard.writeText(markdownReport);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  }

  function copyJson() {
    void navigator.clipboard.writeText(jsonReport);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 backdrop-blur-md">
      <div className="card relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-surface/90 px-6 py-4">
          <div>
            <h3 className="text-[17px] font-semibold text-ink">
              Export Audit & LLM Ingestion Formats
            </h3>
            <p className="text-[12px] text-ink-faint">
              Export findings into prompt formats ready to feed into ChatGPT, Claude, or internal automation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="mono flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-faint hover:text-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Quick Export Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* LLM Remediation Prompt */}
            <div className="flex flex-col justify-between rounded-xl border border-signal/30 bg-signal/5 p-4">
              <div>
                <span className="mono text-[10.5px] uppercase tracking-wider text-signal font-bold">
                  Recommended for AI
                </span>
                <h4 className="mt-1 text-[14px] font-semibold text-ink">
                  Prompt for LLMs
                </h4>
                <p className="mt-1 text-[12px] text-ink-dim leading-relaxed">
                  Turnkey prompt for Claude or ChatGPT to write exact code and schema fixes.
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="mono inline-flex items-center justify-center gap-1.5 h-9 rounded-md bg-signal px-3 text-[12px] font-semibold text-void transition-colors hover:brightness-110"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy LLM Prompt</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => download(`${baseName}-llm-prompt.md`, llmPrompt, "text/markdown")}
                  className="mono inline-flex items-center justify-center gap-1.5 h-8 rounded-md border border-line bg-surface px-3 text-[11px] text-ink-dim hover:text-ink"
                >
                  <FileDown className="h-3 w-3" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Markdown Audit Report */}
            <div className="flex flex-col justify-between rounded-xl border border-line bg-surface/50 p-4">
              <div>
                <span className="mono text-[10.5px] uppercase tracking-wider text-ink-faint">
                  Documentation
                </span>
                <h4 className="mt-1 text-[14px] font-semibold text-ink">
                  Executive Report
                </h4>
                <p className="mt-1 text-[12px] text-ink-dim leading-relaxed">
                  Comprehensive Markdown audit report with all scores and diagnostic tables.
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={copyMarkdown}
                  className="mono inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-line bg-surface px-3 text-[12px] font-medium text-ink transition-colors hover:border-line-bright"
                >
                  {copiedMd ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-signal" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => download(`${baseName}-report.md`, markdownReport, "text/markdown")}
                  className="mono inline-flex items-center justify-center gap-1.5 h-8 rounded-md border border-line bg-surface px-3 text-[11px] text-ink-dim hover:text-ink"
                >
                  <FileDown className="h-3 w-3" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Structured JSON Payload */}
            <div className="flex flex-col justify-between rounded-xl border border-line bg-surface/50 p-4">
              <div>
                <span className="mono text-[10.5px] uppercase tracking-wider text-ink-faint">
                  API & Automation
                </span>
                <h4 className="mt-1 text-[14px] font-semibold text-ink">
                  Raw JSON Data
                </h4>
                <p className="mt-1 text-[12px] text-ink-dim leading-relaxed">
                  Full machine-readable payload containing all raw evidence, scores, and blocks.
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={copyJson}
                  className="mono inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-line bg-surface px-3 text-[12px] font-medium text-ink transition-colors hover:border-line-bright"
                >
                  {copiedJson ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-signal" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => download(`${baseName}-audit.json`, jsonReport, "application/json")}
                  className="mono inline-flex items-center justify-center gap-1.5 h-8 rounded-md border border-line bg-surface px-3 text-[11px] text-ink-dim hover:text-ink"
                >
                  <FileDown className="h-3 w-3" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="rounded-xl border border-line bg-surface/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="mono text-[11.5px] font-semibold text-ink">Preview Format:</span>
                <div className="flex gap-1">
                  {(
                    [
                      ["prompt", "LLM Prompt"],
                      ["markdown", "Markdown Report"],
                      ["json", "JSON Payload"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActivePreview(id)}
                      className={`mono rounded px-2.5 py-0.5 text-[11px] transition-colors ${
                        activePreview === id
                          ? "bg-signal text-void font-bold"
                          : "text-ink-faint hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4">
              <pre className="mono thin-scroll max-h-64 overflow-auto rounded-lg bg-base p-3 text-[11.5px] leading-relaxed text-ink-dim">
                {activePreview === "prompt"
                  ? llmPrompt
                  : activePreview === "markdown"
                  ? markdownReport
                  : jsonReport}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-line bg-surface/80 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="mono rounded-lg bg-raised px-4 py-1.5 text-[12px] font-medium text-ink hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
