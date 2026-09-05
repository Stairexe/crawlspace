# Research — The Scoring Model

This file is the specification the engine implements. `lib/scoring/` must match it.

## Shape of the model

Crawlspace runs **one evidence pass** and **five weight vectors** over it.

```
fetch → evidence (facts about the site)
      → checks  (each check reads evidence, returns pass/warn/fail + weight-independent detail)
      → 5 engine scores (each engine applies its own weights to the same check results)
      → composite score (mean of the five, shown as a secondary number, never the headline)
```

The headline UI number is the **composite**, but the per-engine spread is always visible
next to it, because the spread is where the actionable information lives (finding #2).

## The gate

Three checks are **gates**, not weighted contributors. If a gate fails for an engine, that
engine's score is hard-capped at 25 regardless of everything else, and the report leads
with the gate failure.

| Gate | Fails when | Caps |
|---|---|---|
| Crawler access | robots.txt disallows that engine's user agent on `/` | that engine only |
| Reachability | page returns non-2xx, or times out | all engines |
| Content renders without JS | server HTML has < 200 words of body text | all engines |

Rationale: block GPTBot and no amount of FAQ schema makes ChatGPT cite you. Averaging that
into a 70/100 would be a lie.

## Categories and base weights

| # | Category | Base weight | What it measures |
|---|---|---|---|
| 1 | Extractability | 30 | Block-level: do paragraphs survive being lifted out of the page? |
| 2 | Answer structure | 18 | Headings phrased as queries, direct answers, tables, lists, FAQ blocks |
| 3 | Evidence density | 16 | Statistics with sources, named citations, quotes, dated claims |
| 4 | Machine readability | 14 | JSON-LD schema, semantic HTML, llms.txt, pricing.md, sitemap |
| 5 | Authority signals | 12 | Named author, credentials, org schema, freshness/dateModified |
| 6 | Retrievability | 10 | Title/meta, canonical, heading hierarchy, internal linking, speed |

Extractability is the largest single category, at 30, because content-answer fit is ~55%
of citation likelihood (finding #3). Categories 4 and 6 together are 24 — deliberately
below the incumbent tools' ~40–50% technical weighting.

## Per-engine weight vectors

Each engine multiplies the base weights. Multipliers are normalised so each engine's
weights still sum to 100.

| Category | Google AIO | ChatGPT | Perplexity | Claude | Copilot |
|---|---|---|---|---|---|
| Extractability | 0.8 | 1.3 | 1.2 | 1.1 | 1.0 |
| Answer structure | 0.9 | 1.2 | 1.3 | 1.0 | 1.1 |
| Evidence density | 1.1 | 1.1 | 1.2 | **1.5** | 0.9 |
| Machine readability | 1.2 | 0.8 | **1.3** | 0.9 | 1.1 |
| Authority signals | **1.4** | 1.2 | 1.0 | 1.2 | 1.0 |
| Retrievability | 1.1 | 0.9 | 0.8 | 0.8 | **1.3** |

Justification per column:

- **Google AI Overviews** — E-E-A-T weighted heaviest; Google states structure/AI-files are
  not required, so extractability is *down*-weighted and authority is up-weighted. Crawlspace
  is the only tool in this category that lowers the llms.txt penalty for Google on purpose.
- **ChatGPT** — content-answer fit dominates (~55%); freshness is a strong signal.
- **Perplexity** — FAQPage JSON-LD and self-contained atomic paragraphs are its known
  preferences; hence machine readability and answer structure both up.
- **Claude** — cites selectively and rewards factual density with named sources above all.
- **Copilot** — Bing index, page-speed threshold ~2s, entity definitions; retrievability up.

## Extractability, measured

For each content block (a `<p>`, `<li>` group, or heading + following prose) the engine
computes five sub-scores, mirroring the block-level approach the incumbents use but with
Crawlspace's own weights:

| Sub-score | Weight | Rule |
|---|---|---|
| Self-containment | 0.30 | Penalise leading pronouns/deixis with no antecedent in-block ("it", "this", "these", "as mentioned above", "the former"). A block that only makes sense in place cannot be lifted. |
| Answer directness | 0.25 | Does the block open with the claim rather than build to it? Scores the first sentence for assertion vs preamble. |
| Length band | 0.20 | Peak 40–60 words for answer blocks; a secondary band at 130–170 words for explanatory blocks. Penalise < 15 and > 220. |
| Factual density | 0.15 | Numerals, percentages, dates, named entities, currency per 100 words. |
| Readability | 0.10 | Mean sentence length and syllable proxy; target grade 8–12. Penalise > 30-word mean sentences. |

Block score → page extractability = weighted mean over blocks, weighted by block length so
one strong 40-word block does not carry a page of mush.

## Findings and severity

Each failing check produces a finding with:

- `severity`: critical | high | medium | low
- `effort`: trivial | small | medium | large
- `engines`: which of the five this actually hurts (never "all" by default)
- `evidence`: the literal string/selector found on the page, so the user can verify
- `fix`: the concrete change, and for content findings, the AI rewrite handle

Severity is assigned by **(weight of the category) × (engines affected)**, not by vibes.

## Projected lift

When a rewrite is generated, Crawlspace re-runs the same block scorer against the rewritten
text and shows the real delta. It also annotates which Princeton GEO tactic the rewrite
applied (cite sources +40%, statistics +37%, quotations +30%, authoritative tone +25%) —
labelled as *published study lift for that tactic*, never as a promise about the user's site.

Anything the tool cannot measure, it does not claim.
