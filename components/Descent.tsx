"use client";

import { useEffect, useRef } from "react";
import { CrawlBot, GROUND, LEGS, type Leg, type Pt } from "./CrawlBot";

/**
 * The Descent — Crawlspace's opening, once per session, on "/" only.
 *
 *   0.00s  the floor line is drafted across the sheet; the crawlspace below it fills
 *   0.25s  the inspector walks in along the floor (tripod gait, feet stay planted)
 *   1.70s  it stops mid-sheet and lights its torch
 *   1.85s  a section cut A–A is struck through it, top to bottom
 *   2.20s  it plants its feet on both halves and pushes: the sheet splits on the cut,
 *          the legs stretch with the floor they are standing on
 *   2.95s  it lets go, gathers its legs and settles into the logo in the nav bar
 *
 * The page underneath is fully server-rendered the whole time. This is an overlay,
 * shown only when an inline <head> script set html[data-descent] ("play") before first
 * paint (never on repeat visits, never with reduced motion, never without JS). A CSS
 * failsafe hides it after 7s regardless. Any key, click, scroll or touch skips it.
 *
 * One rAF clock drives everything so that skipping, and the feet tracking the moving
 * floor, stay exact. Only transforms, opacity and SVG geometry change per frame.
 */

const KEY = "cs-descent";

const T = {
  floor: [0, 650],
  word: [300, 1100],
  walk: [250, 1650],
  lamp: [1650, 1850],
  seam: [1850, 2200],
  split: [2200, 3100],
  fly: [2950, 3650],
  end: 3700,
} as const;

const GAIT_PERIOD = 360;
const STRIDE = 6; // viewBox units either side of rest
const LIFT = 6;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
// Strong curves, per the motion rules: ease-out for arrivals, quart ease-in-out for moves.
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOut = (p: number) => (p < 0.5 ? 8 * p ** 4 : 1 - Math.pow(-2 * p + 2, 4) / 2);

interface LegEls {
  leg: Leg;
  limb: SVGPolylineElement;
  pin: SVGCircleElement | null;
  foot: SVGLineElement | null;
}

function setLeg(els: LegEls, knee: Pt, foot: Pt) {
  const { leg } = els;
  els.limb.setAttribute(
    "points",
    `${leg.hip[0]},${leg.hip[1]} ${knee[0].toFixed(2)},${knee[1].toFixed(2)} ${foot[0].toFixed(2)},${foot[1].toFixed(2)}`,
  );
  if (els.pin) {
    els.pin.setAttribute("cx", knee[0].toFixed(2));
    els.pin.setAttribute("cy", knee[1].toFixed(2));
  }
  if (els.foot) {
    els.foot.setAttribute("x1", (foot[0] - 3).toFixed(2));
    els.foot.setAttribute("x2", (foot[0] + 3).toFixed(2));
    els.foot.setAttribute("y1", foot[1].toFixed(2));
    els.foot.setAttribute("y2", foot[1].toFixed(2));
  }
}

/** Tripod gait: l1, r2, l3 swing together; r1, l2, r3 swing half a period later. */
const GROUP_B = new Set(["r1", "l2", "r3"]);

function gait(t: number, leg: Leg, amp: number): { dx: number; lift: number } {
  if (amp <= 0) return { dx: 0, lift: 0 };
  const phase = (t - T.walk[0]) / GAIT_PERIOD + (GROUP_B.has(leg.id) ? 0.5 : 0);
  const f = phase - Math.floor(phase);
  if (f < 0.5) {
    const q = f / 0.5; // swing: foot lifts and travels forward
    return { dx: lerp(-STRIDE, STRIDE, easeInOut(q)) * amp, lift: Math.sin(Math.PI * q) * LIFT * amp };
  }
  const q = (f - 0.5) / 0.5; // stance: foot planted, body passes over it
  return { dx: lerp(STRIDE, -STRIDE, q) * amp, lift: 0 };
}

function Sheet({ offset }: { offset: "0" | "-50vw" }) {
  return (
    <div className="absolute inset-y-0 w-screen" style={{ left: offset }}>
      <div className="descent-vellum absolute inset-0" />

      <div className="mono absolute left-5 top-5 text-[10.5px] uppercase tracking-[0.14em] text-ink-faint sm:left-8 sm:top-7">
        Crawlspace
        <span className="block normal-case tracking-normal text-ink-dim">
          Structural survey of a web page
        </span>
      </div>
      <div className="mono absolute right-5 top-5 text-right text-[10.5px] uppercase tracking-[0.14em] text-ink-faint sm:right-8 sm:top-7">
        Sheet 01 of 01
        <span className="block normal-case tracking-normal text-ink-dim">Section A–A</span>
      </div>

      <div className="mono absolute left-5 text-[10px] uppercase tracking-[0.14em] text-ink-faint sm:left-8" style={{ top: "calc(var(--floor) - 22px)" }}>
        Floor line — the page as served
      </div>

      {/* Below the floor: the crawlspace itself */}
      <div data-d="under" className="descent-under absolute inset-x-0 bottom-0 overflow-hidden" style={{ top: "var(--floor)", clipPath: "inset(0 0 100% 0)" }}>
        <div data-d="ruler" className="descent-ruler absolute inset-x-0 top-0 h-[9px]" />
        <div className="absolute inset-x-5 bottom-[12%] overflow-hidden sm:inset-x-8">
          <div data-d="word" className="descent-word">
            Crawlspace
          </div>
        </div>
        <div className="mono absolute bottom-5 right-5 text-[10px] uppercase tracking-[0.14em] text-wash/70 sm:right-8">
          Any key skips
        </div>
      </div>

      <div data-d="floor" className="absolute inset-x-0 h-[2px] bg-signal" style={{ top: "calc(var(--floor) - 1px)" }} />
    </div>
  );
}

export function Descent() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    if (!el || html.dataset.descent !== "play") return;
    // States: "play" holds the page's entrance; "open" (set at the split) releases it.

    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* storage unavailable: it will play again next load, which is harmless */
    }

    const halves = Array.from(el.querySelectorAll<HTMLElement>("[data-half]"));
    const floors = Array.from(el.querySelectorAll<HTMLElement>('[data-d="floor"]'));
    const rulers = Array.from(el.querySelectorAll<HTMLElement>('[data-d="ruler"]'));
    const unders = Array.from(el.querySelectorAll<HTMLElement>('[data-d="under"]'));
    const words = Array.from(el.querySelectorAll<HTMLElement>('[data-d="word"]'));
    const seam = el.querySelector<HTMLElement>("[data-seam]")!;
    const wrap = el.querySelector<HTMLElement>("[data-bot]")!;
    const svg = wrap.querySelector("svg")!;
    const lens = svg.querySelector<SVGCircleElement>("[data-lens]");
    const beam = svg.querySelector<SVGPolygonElement>("[data-beam]");
    const legs: LegEls[] = LEGS.map((leg) => {
      const g = svg.querySelector<SVGGElement>(`[data-leg="${leg.id}"]`)!;
      return {
        leg,
        limb: g.querySelector("polyline")!,
        pin: g.querySelector('[data-part="pin"]'),
        foot: g.querySelector('[data-part="foot"]'),
      };
    });
    const mark = document.querySelector<HTMLElement>("[data-logo-mark]");

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const vw = window.innerWidth;
    const W = wrap.getBoundingClientRect().width;
    const unit = 120 / W; // px -> viewBox units
    const walkFrom = -(vw / 2 + W);
    const splitDistance = vw / 2 + 24;

    let flight: { dx: number; dy: number; s: number } | null = null;
    let raf = 0;
    let done = false;
    const start = performance.now();

    function finish() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      removeListeners();
      document.body.style.overflow = prevOverflow;
      delete html.dataset.descent;
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        document.querySelector<HTMLInputElement>("#survey-url")?.focus({ preventScroll: true });
      }
    }

    function frame(now: number) {
      const t = now - start;

      // Floor drafted left to right, across both halves as one line.
      const pf = easeInOut(span(t, T.floor));
      floors.forEach((f, i) => {
        const local = clamp01(pf * 2 - i); // left half first, then right
        f.style.clipPath = `inset(0 ${(1 - local) * 100}% 0 0)`;
      });
      rulers.forEach((r) => (r.style.opacity = String(span(t, T.floor))));
      // The crawlspace fills in beneath the floor as it is drafted.
      const pu = easeInOut(span(t, [T.floor[0] + 150, T.word[1]]));
      unders.forEach((u) => (u.style.clipPath = `inset(0 0 ${(1 - pu) * 100}% 0)`));
      const pw = easeOut(span(t, T.word));
      words.forEach((w) => (w.style.transform = `translateY(${(1 - pw) * 105}%)`));

      // Walk in.
      const pWalk = span(t, T.walk);
      const x = walkFrom * (1 - easeOut(pWalk));
      const amp = clamp01((T.walk[1] - t) / 260);
      const bob = amp > 0 ? -Math.abs(Math.sin(((t - T.walk[0]) / GAIT_PERIOD) * Math.PI * 2)) * 1.6 * amp : 0;

      // Torch.
      const pl = span(t, T.lamp);
      const pFly = easeInOut(span(t, T.fly));
      if (lens) lens.style.fill = pl > 0.4 ? "var(--color-lamp)" : "";
      if (beam) beam.setAttribute("opacity", String(0.38 * easeOut(pl) * (1 - clamp01(pFly * 3))));

      // Section cut struck through the inspector, then fading as the sheet parts.
      const ps = easeInOut(span(t, T.seam));
      const pSplit = easeInOut(span(t, T.split));
      // Struck outward from the floor (60% down), by clipping rather than scaling so the
      // dashes and the A markers never distort.
      seam.style.clipPath = `inset(${60 * (1 - ps)}% -30px ${40 * (1 - ps)}% -30px)`;
      seam.style.opacity = String(1 - pSplit);

      // The split. Feet are planted on the floor, so they travel with their half.
      // As the sheet starts to part, the page's own entrance begins underneath it.
      if (t >= T.split[0] && html.dataset.descent === "play") html.dataset.descent = "open";
      const shift = pSplit * splitDistance;
      halves.forEach((h) => {
        h.style.transform = `translate3d(${h.dataset.half === "l" ? -shift : shift}px,0,0)`;
      });
      const stretch = shift * unit * (1 - pFly);

      for (const l of legs) {
        const side = l.leg.side === "l" ? -1 : 1;
        const g = gait(t, l.leg, amp);
        const reach = stretch * side;
        const rise = Math.min(stretch * 0.09, 26);
        setLeg(
          l,
          [l.leg.knee[0] + g.dx * 0.55 + reach * 0.5, l.leg.knee[1] - g.lift * 0.5 - rise],
          [l.leg.foot[0] + g.dx + reach, GROUND - g.lift],
        );
      }

      // Settle into the logo mark.
      if (t >= T.fly[0] && !flight) {
        const from = wrap.getBoundingClientRect();
        const to = mark?.getBoundingClientRect();
        flight =
          to && to.width > 0
            ? { dx: to.left - from.left, dy: to.top - from.top, s: to.width / from.width }
            : { dx: 0, dy: -from.top - from.height, s: 0.2 };
      }
      if (flight) {
        wrap.style.transform = `translate3d(${flight.dx * pFly}px, ${flight.dy * pFly}px, 0) scale(${lerp(1, flight.s, pFly)})`;
        wrap.style.opacity = String(1 - span(t, [T.fly[1] - 160, T.fly[1]]));
        if (mark) mark.style.opacity = String(span(t, [T.fly[1] - 200, T.fly[1]]));
      } else {
        wrap.style.transform = `translate3d(${x}px, ${bob}px, 0)`;
      }

      if (t >= T.end) finish();
      else raf = requestAnimationFrame(frame);
    }

    function skip() {
      if (done) return;
      cancelAnimationFrame(raf);
      const fade = el!.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
        fill: "forwards",
      });
      if (mark) mark.style.opacity = "1";
      fade.onfinish = finish;
      removeListeners();
    }

    const events = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    function removeListeners() {
      events.forEach((e) => window.removeEventListener(e, skip));
    }
    events.forEach((e) => window.addEventListener(e, skip, { passive: true }));

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeListeners();
      document.body.style.overflow = prevOverflow;
      if (mark) mark.style.opacity = "";
    };
  }, []);

  return (
    <div ref={root} className="descent" aria-hidden="true">
      <div data-half="l" className="absolute inset-y-0 left-0 w-1/2 overflow-hidden will-change-transform">
        <Sheet offset="0" />
      </div>
      <div data-half="r" className="absolute inset-y-0 right-0 w-1/2 overflow-hidden will-change-transform">
        <Sheet offset="-50vw" />
      </div>

      {/* Section cut A–A */}
      <div
        data-seam
        className="descent-seam absolute inset-y-0 left-1/2"
        style={{ clipPath: "inset(60% -30px 40% -30px)" }}
      >
        <span className="descent-cut" style={{ top: 18 }}>A</span>
        <span className="descent-cut" style={{ bottom: 18 }}>A</span>
      </div>

      <div
        data-bot
        className="descent-bot absolute text-signal"
        style={{ transform: "translate3d(-200vw,0,0)" }}
      >
        <CrawlBot detail="full" className="block h-auto w-full" />
      </div>
    </div>
  );
}
