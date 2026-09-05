# PRD — Crawlspace

**One sentence:** Crawlspace points at a URL, measures how crawlable and citable that page is
to AI assistants, rewrites the paragraphs the assistants cannot use, and scores the result
per engine.

**Status:** v1 shipping. **Owner:** Asodi Rohith Reddy.
**Type:** portfolio piece and public tool — a working artefact for AI-search / GEO roles,
not a funded product.

---

## 1. Problem

AI assistants answer roughly half of informational queries without sending a click. Being
*cited* in that answer has replaced being *ranked* as the thing that matters, and the two
are only loosely correlated — only ~15% of AI Overview sources overlap with the traditional
top ten.

Site owners have no cheap way to answer three questions:

1. Can the AI crawlers even reach me?
2. If they can, is my content in a shape they can lift?
3. What exactly do I change, in which paragraph?

Existing free tools answer (1) and partially (2). None answer (3) — they hand back a list
of problems and leave the writing to you.

## 2. Users

**Primary — the marketer or founder with one site.** Non-technical or semi-technical. Wants
a verdict and a fix, not a 40-row CSV. Will not install anything or create an account.

**Secondary — the SEO/GEO practitioner.** Wants the evidence and the methodology exposed so
they can argue with it. Will not trust a black-box number.

**Tertiary — the person evaluating Rohith for a GEO role.** Opens the live URL, spends
90 seconds, and needs to see that the person who built it understands the domain, not just
the framework.

That third user is a real constraint on the design: the methodology must be visible, the
score must be defensible, and the tool must state its own limits.

## 3. What v1 does

| # | Capability | Detail |
|---|---|---|
| F1 | **Audit a URL** | Fetch the page as an AI crawler would, plus `robots.txt`, `llms.txt`, `sitemap.xml`. Server-rendered HTML only — what the bot actually receives. |
| F2 | **Gate on crawler access** | Resolve robots.txt against 12 named AI user agents. A blocked engine is reported as blocked and hard-capped, never averaged away. |
| F3 | **Score per engine** | Five scores — Google AI Overviews, ChatGPT, Perplexity, Claude, Copilot — from one evidence pass and five weight vectors. Composite shown as secondary. |
| F4 | **Block-level extractability** | Every content block scored on self-containment, answer directness, length band, factual density, readability. The weakest blocks are named and quoted. |
| F5 | **Prioritised findings** | Each finding carries severity, effort, the engines it affects, the literal evidence found, and the fix. |
| F6 | **AI rewrite** | For any weak block, generate a rewritten version that is self-contained, direct, and evidence-led — then re-score it with the same scorer and show the real delta. |
| F7 | **Generate the missing files** | Produce a valid `llms.txt` and the missing JSON-LD blocks, populated from the site's own content, ready to copy. |
| F8 | **Export** | Download the full audit as Markdown or JSON. |
| F9 | **Methodology page** | The weights, the sources, and the known limits, published. |

## 4. Explicitly out of scope for v1

- Accounts, saved history, or a database
- Live citation monitoring across the five engines
- Multi-page site crawls (v1 audits one URL, plus its root files)
- Backlink or domain-authority data
- Any claim that using the tool will get you cited

## 5. Behaviour when there is no API key

The deterministic engine — F1 through F5, F7, F8 — runs with **no keys at all**. Only F6,
the rewrite, needs a model. With no key configured the rewrite panel explains what it would
do and stays disabled; nothing else degrades.

This is a hard requirement: the public deployment must be fully useful to a stranger who
brings no credentials, and must not burn the owner's API budget on strangers' traffic.
Users may paste their own key, held in the browser for the session and never persisted.

## 6. Success criteria

| Criterion | Target |
|---|---|
| A real site audits end-to-end | < 8s p50 |
| Score is defensible | Every number traces to a check, every check to `research/scoring-model.md` |
| Zero-key usability | Full audit and export with no environment variables set |
| Reviewer legibility | A GEO practitioner can find the methodology in one click and disagree with it specifically |
| Résumé line | "Built a GEO audit engine that scores per AI engine and rewrites failing content — [live URL]" is true and verifiable |

## 7. Non-goals as principles

- **Never invent evidence.** The rewriter restructures what is there; it does not add facts,
  statistics, or citations that the source page did not contain.
- **Never present a blended number as the truth.** The engines disagree; the spread is the point.
- **Never claim unmeasured lift.** Published study figures are labelled as published study figures.

## 8. Open questions

- `[OPEN]` Should the composite score be shown at all, or does it undercut finding #2? — v1 shows it, subordinated. Revisit after real use.
- `[OPEN]` Multi-page crawl is the most requested obvious next feature and the most likely to force a storage decision. Deferred to v2 deliberately.
