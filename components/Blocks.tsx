"use client";

import { useState } from "react";
import type { AuditReport, ContentBlock, RewriteResult } from "@/lib/types";
import { SUB_LABELS } from "@/lib/blocks";
import { CopyButton, MiniBar, Pill, scoreColor } from "./primitives";

interface AiState {
  enabled: boolean;
  providers: string[];
  userKey: string;
  provider: "anthropic" | "openai";
}

function RewritePanel({ result }: { result: RewriteResult }) {
  const beforePct = Math.round(result.before.total * 100);
  const afterPct = Math.round(result.after.total * 100);
  const gain = afterPct - beforePct;

  return (
    <div className="rise mt-3 space-y-3 rounded-lg border border-signal/25 bg-signal/[0.035] p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="mono text-[10px] uppercase tracking-[0.14em] text-signal">rewritten</span>
        <span className="mono flex items-center gap-1.5 text-[12px]">
          <span style={{ color: scoreColor(beforePct) }}>{beforePct}</span>
          <span className="text-ink-faint">→</span>
          <span style={{ color: scoreColor(afterPct) }}>{afterPct}</span>
          <span
            className="ml-0.5 font-semibold"
            style={{ color: gain > 0 ? "var(--color-good)" : "var(--color-warn)" }}
          >
            {gain > 0 ? `+${gain}` : gain}
          </span>
        </span>
        <span className="mono text-[11px] text-ink-faint">re-scored, not estimated</span>
        <span className="ml-auto">
          <CopyButton text={result.rewritten} />
        </span>
      </div>

      <p className="rounded-md border border-line bg-base px-3.5 py-3 text-[13.5px] leading-relaxed text-ink">
        {result.rewritten}
      </p>

      {result.notes.length > 0 && (
        <ul className="space-y-1">
          {result.notes.map((n, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-ink-dim">
              <span aria-hidden className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
              {n}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <span className="mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          tactics applied
        </span>
        {result.tacticsApplied.map((t) => (
          <Pill key={t.name} title={`Published lift for this tactic in the Princeton GEO study: ${t.publishedLift}`}>
            {t.name} {t.publishedLift}
          </Pill>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-ink-faint">
        Lift figures are the published, study-wide results for each tactic — not a prediction
        about this page. The only measured number here is the {beforePct} → {afterPct} re-score,
        which runs the rewritten text back through the same scorer.
      </p>
    </div>
  );
}

function BlockCard({
  block,
  pageTitle,
  ai,
  index,
}: {
  block: ContentBlock;
  pageTitle: string | null;
  ai: AiState;
  index: number;
}) {
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pct = Math.round(block.scores.total * 100);
  const canRewrite = ai.enabled || ai.userKey.trim().length > 0;

  async function rewrite() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          blockId: block.id,
          text: block.text,
          heading: block.heading,
          kind: block.kind,
          pageTitle,
          provider: ai.provider,
          apiKey: ai.userKey.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "The rewrite failed.");
      setResult(json as RewriteResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The rewrite failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card rise p-4" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="mono text-[15px] font-semibold" style={{ color: scoreColor(pct) }}>
          {pct}
        </span>
        <Pill>{block.kind}</Pill>
        <span className="mono text-[11px] text-ink-faint">{block.words} words</span>
        {block.heading && (
          <span className="mono truncate text-[11px] text-ink-faint">under “{block.heading}”</span>
        )}
        <span className="mono ml-auto truncate text-[10px] text-ink-faint/70">{block.domPath}</span>
      </div>

      <p className="mt-3 rounded-md border border-line bg-base px-3.5 py-3 text-[13.5px] leading-relaxed text-ink-dim">
        {block.text.length > 480 ? block.text.slice(0, 480) + "…" : block.text}
      </p>

      <div className="mt-3.5 grid max-w-3xl gap-1.5 sm:grid-cols-2 sm:gap-x-8">
        {(Object.keys(SUB_LABELS) as (keyof typeof SUB_LABELS)[]).map((k) => (
          <MiniBar key={k} label={SUB_LABELS[k]} value={block.scores[k]} />
        ))}
      </div>

      {block.notes.length > 0 && (
        <ul className="mt-3 space-y-1">
          {block.notes.map((n, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-ink-faint">
              <span aria-hidden className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-warn/70" />
              {n}
            </li>
          ))}
        </ul>
      )}

      {!result && (
        <div className="mt-3.5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={rewrite}
            disabled={busy || !canRewrite}
            className="mono rounded-md bg-signal px-3.5 py-1.5 text-[12px] font-semibold text-void transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
          >
            {busy ? "rewriting…" : "rewrite this block"}
          </button>
          {!canRewrite && (
            <span className="text-[11.5px] text-ink-faint">
              Needs a model key — add one above to enable rewriting.
            </span>
          )}
          {error && <span className="text-[11.5px] text-danger">{error}</span>}
        </div>
      )}

      {result && <RewritePanel result={result} />}
    </div>
  );
}

export function WeakBlocks({
  report,
  ai,
}: {
  report: AuditReport;
  ai: AiState;
}) {
  if (report.weakestBlocks.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold tracking-tight">The passages</h2>
        <div className="card p-6">
          <p className="text-[14px] leading-relaxed text-ink-dim">
            Every block on this page scores above 75. There is nothing here an assistant would
            struggle to lift.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[16px] font-semibold tracking-tight">
          The passages an assistant cannot use{" "}
          <span className="mono ml-1 text-[12px] font-normal text-ink-faint">
            weakest {report.weakestBlocks.length} of {report.evidence.blocks.length}
          </span>
        </h2>
      </div>
      <p className="max-w-3xl text-[13px] leading-relaxed text-ink-faint">
        Every block on the page was scored on the five sub-measures below. These are the ones
        that fail hardest when lifted out of context. Rewriting them is the highest-leverage
        change available on this page.
      </p>
      <div className="space-y-3">
        {report.weakestBlocks.map((b, i) => (
          <BlockCard
            key={b.id}
            block={b}
            pageTitle={report.evidence.html.title}
            ai={ai}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

export type { AiState };
