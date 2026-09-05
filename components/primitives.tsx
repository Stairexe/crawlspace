"use client";

import { useEffect, useState } from "react";
import type { Severity, Effort } from "@/lib/types";

export function scoreColor(score: number): string {
  if (score >= 80) return "var(--color-good)";
  if (score >= 60) return "var(--color-signal)";
  if (score >= 40) return "var(--color-warn)";
  return "var(--color-danger)";
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Workable";
  if (score >= 40) return "Weak";
  return "Invisible";
}

export const SEVERITY_STYLE: Record<Severity, { bg: string; fg: string; label: string }> = {
  critical: { bg: "rgba(255,107,94,0.13)", fg: "var(--color-danger)", label: "Critical" },
  high: { bg: "rgba(245,181,68,0.13)", fg: "var(--color-warn)", label: "High" },
  medium: { bg: "rgba(195,245,60,0.11)", fg: "var(--color-signal)", label: "Medium" },
  low: { bg: "rgba(163,171,184,0.10)", fg: "var(--color-ink-dim)", label: "Low" },
};

export const EFFORT_LABEL: Record<Effort, string> = {
  trivial: "minutes",
  small: "under an hour",
  medium: "a few hours",
  large: "a project",
};

export function Pill({
  children,
  fg = "var(--color-ink-dim)",
  bg = "rgba(163,171,184,0.10)",
  title,
}: {
  children: React.ReactNode;
  fg?: string;
  bg?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className="mono inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.07em]"
      style={{ color: fg, background: bg }}
    >
      {children}
    </span>
  );
}

/** A labelled 0–1 bar used for the block sub-scores. */
export function MiniBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[104px] shrink-0 text-[11px] text-ink-faint">{label}</span>
      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: scoreColor(pct) }}
        />
      </div>
      <span className="mono w-8 shrink-0 text-right text-[11px] text-ink-dim">{pct}</span>
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1800);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
        } catch {
          setDone(false);
        }
      }}
      className="mono rounded-md border border-line px-2.5 py-1 text-[11px] text-ink-dim transition-colors hover:border-line-bright hover:text-ink"
    >
      {done ? "copied" : label.toLowerCase()}
    </button>
  );
}

/** Counts up to `value` once, respecting reduced motion. */
export function useCountUp(value: number, duration = 900): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return n;
}
