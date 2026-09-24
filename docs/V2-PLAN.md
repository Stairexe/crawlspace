# Crawlspace v2 — Plan

Direction: **The Structural Survey** (impeccable direction seed `d1e5a0f0`, assigned index 6).
Product truth: `PRODUCT.md`. Mode: Persuade (landing) + Operate (audit/dashboard).

---

## 1. The direction contract

**THESIS** — Crawlspace is a building inspection report for a web page: measured drawing,
numbered defect schedule, severity per defect, literal evidence, and a signed "areas not
inspected". It refuses the scored-dashboard-with-gauges arrangement the category ships.

**OWN-WORLD** — Drafting vellum ground (cool grey-white, never cream). Prussian/diazo blue
owning whole regions as line work, rules and plate fields. Surveyor's orange-red reserved
exclusively for defect annotation — it appears nowhere decorative. Process black body.
Archivo / Archivo Expanded for plate titles and display; Martian Mono for annotations,
agent names, scores and addresses.

**STORY** — The visitor understands that AI assistants quote passages rather than read
pages; believes Crawlspace inspects rather than guesses, because it states what it could
not reach; and submits a URL from the title block.

**FIRST VIEWPORT** — Title block upper-left (project / date / surveyor / revision), with
the URL field occupying the project line. Right two-thirds: the measured drawing of the
page under inspection, callout leaders keyed to numbered defects. Primary action sits in
the title block, where a surveyor signs.

**FORM** — Building survey report. Position 6 of 7 on the resonance-ordered list. Seed
key `d1e5a0f0`.

**FINISH** — unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, and DESIGN.md.

### Why this world is true to the product, not decoration

| Survey convention | Crawlspace mechanic |
|---|---|
| "Areas not inspected" — a mandatory section where the surveyor declines to guess | The methodology page's published limits |
| No access to the crawlspace → recorded as *not inspected*, never estimated | A blocked engine is gated at 25, never averaged |
| Numbered defect schedule with severity and location | Findings with severity, effort and literal evidence |
| Photograph attached to each defect | The quoted passage attached to each block finding |
| Measured drawing the defects key back to | The page's block structure |
| Different schedules for different regulations | Five engines, five weight vectors, one evidence pass |

---

## 2. Sitemap and IA

```
PUBLIC
  /                     Landing (Persuade). Intro sequence. Live audit from the title block.
  /methodology          The published model — weights, multipliers, limits. Credibility anchor.
  /survey/[id]          A completed audit report. Shareable. REAL DATA ONLY.
  /survey/[id]/[section]  Deep view: extractability · structure · evidence · machine · authority · retrieval
  /about                Who built it, and the validation status stated plainly.
  /privacy  /terms      Legal.

ACCOUNT  (Firebase — shell now, real later)
  /login  /signup       Auth.
  /surveys              List of the operator's saved audits. Empty state is a real empty state.
  /surveys/compare      Two audits side by side (same page over time, or two pages).
  /settings             API key, export defaults, account.

API
  POST /api/audit       Deterministic engine. No key required.
  POST /api/rewrite     LLM layer. Key required. UNPROVEN until exercised.
  POST /api/generate    llms.txt · JSON-LD · robots.txt allow-group. No key required.
```

### Route changes from v1
- `/dashboard` → `/surveys`. "Dashboard" is the category's word; a surveyor has a job file.
- `/report/[shareId]` → `/survey/[id]`. Consistent noun throughout.
- `/history` and `/reports` collapse into `/surveys` — they were the same list twice.
- `/audit/new` deleted; the landing title block *is* the new-audit form.
- **`lib/mockReport.ts` deleted.** Not restyled. Empty states replace it.

### The flow
1. Land → intro sequence → title block.
2. Enter URL → the drawing builds as the audit runs (real progress, real stages).
3. Report: verdict → five engine schedules → defect schedule → the passages → generated files.
4. "Areas not inspected" closes every report, linking to the methodology.
5. Signed out: export or copy a link. Signed in: it saves to `/surveys`.

---

## 3. Design system

### Colour — Committed strategy
Blue is not an accent; it owns the plate fields and rules.

| Token | Value | Role |
|---|---|---|
| `--vellum` | `#F4F5F2` | Ground. Cool grey-white drafting stock. |
| `--vellum-rule` | `#E2E5E0` | Faint grid, 8mm pitch |
| `--diazo` | `#1B3A6B` | Primary line work, plate fields, rules |
| `--diazo-wash` | `#DCE4F0` | Filled plate regions, table banding |
| `--diazo-deep` | `#0E2547` | (see tokens file) headings on wash |
| `--survey-red` | `#C4421A` | DEFECT ANNOTATION ONLY. Never decorative. |
| `--graphite` | `#1A1C1A` | Body text |
| `--graphite-mid` | `#5A5F5C` | Secondary text |
| `--stamp` | `#7A1F12` | Surveyor's stamp, revision marks |

Dark mode is a *second stock*, not an inversion: blueprint reversal — diazo blue ground,
white line work. Written later, from the built world.

**Severity is ordinal and never colour-alone.** Every defect states its band in text
(`CRITICAL` / `MAJOR` / `MINOR` / `NOTED`) alongside the mark.

### Type
- **Archivo Expanded** — plate titles, the headline. Institutional signage authority.
- **Archivo** — body, UI.
- **Martian Mono** — annotations, agent names, scores, addresses, the title block.
- Both Google Fonts, open licence, nothing to purchase. Neither is on the AI-default list.

### Motion (per emil-design-eng)
```
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1)     entering/exiting
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)    on-screen movement
```
- UI transitions under 300ms. Button `:active` → `scale(0.97)`, 160ms.
- Never `ease-in`. Never `transition: all`. Never enter from `scale(0)`.
- Callout leaders draw with `clip-path: inset()` — not opacity fades.
- Stagger defect rows 40ms. Exit faster than enter.
- CSS/WAAPI over JS animation: it runs off the main thread and won't drop frames while
  an audit request is in flight.

---

## 4. The intro sequence — "Descent"

Full cinematic gate, as chosen. **Overlay above fully server-rendered HTML** — the content
exists in the DOM the whole time, so the site still passes its own renders-without-JS gate.

| t | Beat |
|---|---|
| 0.0–0.4s | Vellum ground. A single blue rule draws left to right — the floor line. |
| 0.4–1.2s | The crawler unit lowers from above the rule. Six legs extend and lock, staged 40ms apart. |
| 1.2–2.2s | It descends below the rule into the void. Torch cone opens. |
| 2.2–3.2s | The sweep reveals measured-drawing linework where the torch passes — the page's structure, drawn not faded. |
| 3.2–3.8s | Drawing resolves; overlay lifts as a single `clip-path` wipe; title block is already focused. |

- Plays once per visitor (`sessionStorage`), and never on a return within the session.
- `prefers-reduced-motion`: no descent, no sweep. The drawing is simply present, 200ms fade.
- Skippable on any keypress or click despite being a "gate" — an uninterruptible animation
  on a tool is a liability, and the drama survives being escapable.
- Hand-built with WAAPI + SVG `stroke-dashoffset`. No animation library added.

---

## 5. Phases

**P0 — Truth (blocking, ~half a day)**
Delete `lib/mockReport.ts`. Hero runs a real audit server-side. Remove the fake browser
chrome and `audit.crawlspace.dev`. Auth pages get honest states. *Nothing else ships before this.*

**P1 — System** Tokens, fonts, the two type scales, motion primitives, base components.

**P2 — Landing** Intro sequence, title block, measured drawing, the real-audit demo,
"areas not inspected" close.

**P3 — Report** `/survey/[id]` as defect schedule. The six section views. Generated files.

**P4 — Account shell** `/surveys`, compare, settings. Firebase wired.

**P5 — Proof** The validation study. The only thing that makes the score defensible.

**P6 — Finish** Detector pass, finish review, DESIGN.md.

---

## 6. Open, and honest

- The rewrite layer has never executed. It cannot be described as working until a key is
  configured and it runs once.
- The scoring model is unvalidated. Until P5, the site must not imply otherwise.
- No users, no traffic, no testimonials. None may be invented to fill a section.
