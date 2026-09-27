"use client";

import { useState } from "react";
import type { Evidence } from "@/lib/types";

/**
 * The crawler's-eye view: exactly what Crawlspace's crawler received and could use —
 * the served HTML's heading outline and every content block it extracted, in page
 * order, with the score each block earned. No JavaScript was run to produce it, which
 * is the point: this is what an AI crawler that does not render JS has to work with.
 */
function tone(total: number): string {
  if (total >= 0.75) return "border-good";
  if (total >= 0.5) return "border-warn";
  return "border-danger";
}

export function CrawlerView({ evidence }: { evidence: Evidence }) {
  const [showAll, setShowAll] = useState(false);
  const blocks = [...evidence.blocks].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
  const shown = showAll ? blocks : blocks.slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="tb-label">Crawler&apos;s-eye view</div>
        <h3 className="mt-1 text-[18px] text-ink">What an AI crawler actually gets from this page</h3>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-dim">
          This is the served HTML with no JavaScript run: {evidence.html.textWords.toLocaleString("en-US")} words of
          text, {evidence.headings.length} headings and {blocks.length} content blocks long enough to quote. If
          something you can see in a browser is missing here, a crawler that does not render JavaScript
          cannot see it either.
        </p>
        {!evidence.renderedWithoutJs && (
          <p className="mt-3 border-l-2 border-danger pl-3 text-[13px] text-ink">
            The served HTML is close to empty. The content is almost certainly drawn by JavaScript,
            which most AI crawlers do not run.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <nav aria-label="Heading outline" className="card self-start p-5">
          <div className="tb-label">Heading outline</div>
          {evidence.headings.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-faint">No headings in the served HTML.</p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {evidence.headings.slice(0, 40).map((h, i) => (
                <li
                  key={i}
                  className="text-[12.5px] leading-snug text-ink-dim"
                  style={{ paddingLeft: `${(h.level - 1) * 10}px` }}
                >
                  <span className="mono mr-1.5 text-[10px] text-ink-faint">H{h.level}</span>
                  {h.text}
                </li>
              ))}
            </ol>
          )}
        </nav>

        <div className="space-y-3">
          {blocks.length === 0 ? (
            <div className="card p-5 text-[13.5px] text-ink-dim">
              No block of 12 words or more was found in the served HTML.
            </div>
          ) : (
            shown.map((b) => (
              <article key={b.id} className={`card border-l-[3px] p-4 ${tone(b.scores.total)}`}>
                <div className="mono flex flex-wrap items-baseline justify-between gap-2 text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
                  <span>
                    {b.kind} · {b.words} words{b.heading ? ` · under “${b.heading.slice(0, 60)}”` : ""}
                  </span>
                  <span className="text-ink">{Math.round(b.scores.total * 100)}/100</span>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink">{b.text}</p>
                {b.notes.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {b.notes.slice(0, 3).map((n) => (
                      <li key={n} className="text-[12px] text-ink-faint">
                        — {n}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))
          )}
          {blocks.length > 12 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="btn-quiet">
              {showAll ? "Show fewer" : `Show all ${blocks.length} blocks`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
