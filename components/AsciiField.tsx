"use client";

import { useEffect, useRef } from "react";

type Shape = "flame" | "wave" | "orb" | "terrain";

const RAMP = " .·:-=+*#%@";

/**
 * A field of monospace characters whose density traces a shape — the texture behind
 * section heads and the closing call to action. Plain 2D canvas, about 24fps, drawn only
 * while on screen; a single still frame under reduced motion.
 */
export function AsciiField({
  shape = "wave",
  accent = false,
  className = "",
  cell = 9,
}: {
  shape?: Shape;
  /** Paint the densest characters in the accent colour. */
  accent?: boolean;
  className?: string;
  cell?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    const cw = cell * 0.62;
    const ch = cell;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / cw);
      rows = Math.ceil(h / ch);
      ctx.font = `${cell}px ui-monospace, "Geist Mono", Menlo, monospace`;
      ctx.textBaseline = "top";
    };

    const density = (x: number, y: number, t: number): number => {
      // x, y in 0..1
      const nx = x - 0.5;
      const ny = y - 0.5;
      switch (shape) {
        case "flame": {
          const fromBottom = 1 - y;
          const width = 0.42 * Math.pow(Math.max(0, 1 - fromBottom), 0.9) + 0.02;
          const sway = Math.sin(t * 1.6 + y * 9) * 0.03 * fromBottom;
          const d = 1 - Math.abs(nx - sway) / width;
          const flicker = 0.75 + 0.25 * Math.sin(t * 3 + x * 30 + y * 12);
          return Math.min(1, Math.max(0, d) * flicker * (0.55 + 0.75 * (1 - fromBottom)) * 1.25);
        }
        case "orb": {
          const r = Math.sqrt(nx * nx + ny * ny * 1.6);
          const bands = 0.5 + 0.5 * Math.sin(r * 34 - t * 1.4 + Math.atan2(ny, nx) * 3);
          return Math.max(0, 1 - r / 0.48) * (0.45 + 0.55 * bands);
        }
        case "terrain": {
          const ridge = 0.55 + 0.18 * Math.sin(x * 7 + t * 0.4) + 0.08 * Math.sin(x * 23 - t * 0.7);
          const d = (y - ridge) / (1 - ridge + 0.001);
          const fade = 1 - Math.abs(nx) * 1.6;
          return Math.max(0, Math.min(1, 1 - Math.abs(d - 0.2) * 1.8)) * Math.max(0, fade) * (y > ridge ? 1 : 0.2);
        }
        default: {
          const fall = Math.max(0, 1 - Math.sqrt(nx * nx * 1.2 + ny * ny * 2.4) / 0.62);
          const v = 0.5 + 0.5 * Math.sin(x * 14 + t * 0.9) * Math.cos(y * 11 - t * 0.6);
          return fall * (0.25 + 0.75 * v);
        }
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const d = density(i / cols, j / rows, t);
          if (d < 0.06) continue;
          const k = Math.min(RAMP.length - 1, Math.floor(d * RAMP.length));
          const c = RAMP[k];
          if (c === " ") continue;
          ctx.fillStyle = accent && d > 0.72 ? "rgba(255,76,0,0.85)" : `rgba(115,115,115,${0.16 + d * 0.5})`;
          ctx.fillText(c, i * cw, j * ch);
        }
      }
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now() / 1000);
    });
    ro.observe(canvas);

    let visible = false;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      if (!visible || document.hidden) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 42) return;
      last = now;
      draw(now / 1000);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    draw(0.8);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [shape, accent, cell]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none select-none ${className}`} />;
}
