# Crawlspace — design system

Direction: **The Structural Survey.** Every page is a sheet from a building inspection
report. The crawl-bot is the inspector; a web page is the building; a gate failure is a
room the inspector was not allowed into. See `docs/V2-PLAN.md` for the full contract.

## Rules that are not negotiable

- **Survey red (`danger`) marks defects and nothing else.** Never decoration, never a CTA.
- **Nothing on a sheet is invented.** Figures are either live engine output (the specimen
  plate) or explicitly captioned as illustrative (Fig. 1). No fake users, stats or logos.
- **Colour lives in `app/globals.css` tokens.** Components use token utilities only.
- **Motion never gates content.** Everything is server-rendered and readable without JS;
  reveals are scoped to `html[data-js]` and disabled under reduced motion.

## Tokens (all text/ground pairs checked at WCAG AA or better)

| Token | Value | Role |
|---|---|---|
| `void` | `#f2f3ef` | the vellum sheet (page ground) |
| `base` / `raised` | `#e9ebe6` / `#e3e6e0` | recessed / raised stock |
| `surface` | `#fafaf7` | a plate on the sheet |
| `line` / `line-bright` | `#cfd4cc` / `#a9b1a7` | hairlines |
| `ink` / `ink-dim` / `ink-faint` | `#141715` / `#3c423e` / `#5f6661` | graphite text |
| `signal` | `#1b3a6b` | diazo blue: rules, plate borders, primary action |
| `blueprint` | `#0f2342` | the crawlspace (Descent band), button hover |
| `wash` | `#dde5f0` | plate offset shadow, figure fills |
| `danger` | `#b8391a` | survey red, defects only |
| `warn` / `good` / `stamp` | `#8a5200` / `#2e6b3c` / `#7a1f12` | annotation |
| `lamp` | `#f5d77a` | the inspector's torch; Descent and figures only |

## Type

- **Archivo** (variable, `wdth` axis). Body at width 100. Plate titles stretched:
  `h2/h3` width 118 weight 650, `h1` width 125. The wordmark is width 125 weight 700.
- **Martian Mono** for annotation: addresses, check ids, scores, title-block labels.
- Title-block labels (`.tb-label`): 9.5px mono, uppercase, +0.04em.

## Components

- `.plate` — solid surface, 1px diazo border, 4px offset wash shadow (a pasted-up print).
- `.title-block` / `.tb-label` / `.tb-value` / `.tb-split` — the survey form grid. The
  hero's request form is one.
- `.callout` — red numbered circle keyed to a defect.
- `.btn-primary` (diazo → blueprint on hover), `.btn-quiet`, `.chip`, `.nav-link`.
- `SectionHead` — `§ 0n — Name` in the left quarter, headline in the right three.
- `CrawlBot` — `detail="full"` (6 legs, pins, torch beam) and `detail="mark"` (logo).
  Geometry in a 120×84 viewBox, ground at y=78; legs expose `data-leg`/`data-part`.

## Motion

Curves: `--ease-out: cubic-bezier(0.23,1,0.32,1)` for arrivals,
`--ease-in-out: cubic-bezier(0.77,0,0.175,1)` for moves. UI feedback under 300ms, buttons
`scale(0.97)` on press, hover only behind `(hover:hover) and (pointer:fine)`, no
`transition: all`, no layout-property animation.

- `.reveal-line` — headline lines rise out of their own masks, staggered 90ms.
- `.after-descent` — hero furniture; held while the Descent plays.
- `[data-reveal]` — section content fades up once on scroll (`RevealObserver`).
- `[data-draw]` — figure line work drafts on (`.ln` elements with `pathLength=1`), then
  callouts pin in.

### The Descent (`components/Descent.tsx`)

Once per session, on `/` only, never with reduced motion, never without JS. An inline
`<head>` script sets `html[data-descent="play"]` before first paint; a CSS failsafe hides
the overlay after 7s regardless. Any key, click, scroll or touch skips (200ms fade).

| t (ms) | Beat |
|---|---|
| 0–650 | floor line drafted across the sheet; the crawlspace band fills beneath it |
| 300–1100 | the wordmark rises in the crawlspace |
| 250–1650 | the inspector walks in (tripod gait, feet planted, body bob) |
| 1650–1850 | torch lights |
| 1850–2200 | section cut A–A struck through it, outward from the floor |
| 2200–3100 | the sheet splits on the cut; feet ride the floor so the legs stretch; the page's entrance starts underneath (`data-descent="open"`) |
| 2950–3650 | it lets go, gathers its legs and settles into the nav mark |

One rAF clock drives the sequence so skipping and foot-tracking stay exact; only
transforms, opacity, clip-path and SVG geometry change per frame.

## Detector notes

`detect.mjs` flags the two-axis grid gradient as a generated-UI signature. Here it is the
drafting sheet and the blueprint band, which is the case the rule exempts. It stays
faint (≤7% alpha) and never appears inside plates.
