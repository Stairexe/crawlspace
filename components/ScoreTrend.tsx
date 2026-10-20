"use client";

import { useState } from "react";
import type { SavedAuditSummary } from "@/lib/types";

/** Composite score over time for one page, as a line on a 0–100 scale. */
export function ScoreTrend({ rows }: { rows: SavedAuditSummary[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 160;
  const PAD = { l: 28, r: 12, t: 12, b: 22 };
  const n = rows.length;
  const x = (i: number) => PAD.l + (n === 1 ? 0 : (i / (n - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - v / 100) * (H - PAD.t - PAD.b);
  const pts = rows.map((r, i) => `${x(i)},${y(r.composite)}`).join(" ");
  const first = rows[0]?.composite ?? 0;
  const last = rows[n - 1]?.composite ?? 0;
  const delta = last - first;
  const h = hover != null ? rows[hover] : null;

  return (
    <div className="mt-4">
      <div className="flex items-baseline gap-3">
        <span className="num text-[28px] text-ink">{last}</span>
        <span className={`mono text-[13px] ${delta > 0 ? "text-good" : delta < 0 ? "text-danger" : "text-ink-faint"}`}>
          {delta > 0 ? "+" : ""}
          {delta} since first audit
        </span>
        {h && (
          <span className="mono ml-auto text-[12px] text-ink-faint">
            {new Date(h.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · {h.composite}
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-auto w-full"
        role="img"
        aria-label={`Composite score went from ${first} to ${last} over ${n} audits`}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeDasharray={v === 25 ? "3 3" : undefined} />
            <text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" className="fill-ink-faint" style={{ font: "10px var(--font-mono)" }}>
              {v}
            </text>
          </g>
        ))}
        <polyline points={`${PAD.l},${y(0)} ${pts} ${x(n - 1)},${y(0)}`} fill="var(--color-tint-signal)" stroke="none" />
        <polyline points={pts} fill="none" stroke="var(--color-signal)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {rows.map((r, i) => (
          <g key={r.id} onMouseEnter={() => setHover(i)}>
            <rect x={x(i) - 12} y={0} width={24} height={H} fill="transparent" />
            <circle cx={x(i)} cy={y(r.composite)} r={hover === i ? 5 : 3.5} fill="var(--color-surface)" stroke="var(--color-signal)" strokeWidth={2} />
          </g>
        ))}
      </svg>
    </div>
  );
}
