# Crawlspace — v3 build plan (weighted)

*Built 27 Sep 2026 from `docs/COMPETITIVE-TEARDOWN.md`. The original v1 roadmap is `docs/ROADMAP.md`. Every candidate feature is scored the same way, the score decides what is in, and the order is decided by dependencies.*

## How features are scored

Each feature gets 1–5 on five criteria. Weighted sum × 20 = score out of 100.

| Criterion | Weight | The question |
|---|---:|---|
| Differentiation | 30% | Does this put us ahead of SEOmator / GEO Optimizer / ClayHog, or just level? |
| User value | 25% | Would a GEO practitioner use it on most audits? |
| Credibility | 15% | Does it make our scores more defensible or more accurate? |
| Effort (inverse) | 20% | 5 = a day, 1 = weeks |
| Independence | 10% | 5 = needs nothing from Rohith (no keys, money, accounts) |

**Must-have ≥ 70 · Should-have 60–69 · Later 45–59 · Rejected < 45**

## Scores

| # | Feature | Diff | Value | Cred | Effort | Indep | **Score** | Tier |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|---|
| A | **Crawler model accuracy fix** — training bots (GPTBot, ClaudeBot…) no longer counted as citation bots | 4 | 5 | 5 | 5 | 5 | **94** | Must |
| B | Projected score + fix-first plan (exact re-score) | 4 | 5 | 4 | 5 | 5 | **91** | Must |
| C | Rewriter live (needs Anthropic key) | 5 | 5 | 3 | 5 | 2 | **88** | Must |
| D | "Is it cited?" live check (Perplexity Sonar / OpenAI) | 5 | 5 | 5 | 3 | 2 | **86** | Must |
| E | AI crawler log analyser — upload a server log, see which AI bots actually visit (in-browser, nothing stored) | 5 | 4 | 4 | 3 | 5 | **84** | Must |
| F | AI crawler registry 13 → 24 verified tokens | 3 | 4 | 4 | 5 | 5 | **80** | Must |
| G | Crawler's-eye view — the exact text a crawler gets, block by block | 3 | 4 | 4 | 4 | 5 | **76** | Must |
| H | Site mode — sitemap → up to 25 pages, aggregate table | 3 | 5 | 3 | 3 | 5 | **74** | Must |
| I | Compare two surveys (from exported JSON) | 3 | 4 | 3 | 4 | 5 | **73** | Must |
| J | CLI (`npx crawlspace`) + GitHub Action (min-score, SARIF) | 4 | 4 | 3 | 3 | 4 | **73** | Must |
| K | Validation study, published | 5 | 3 | 5 | 2 | 2 | **72** | Must |
| L | Negative signals (keyword stuffing) | 3 | 3 | 4 | 4 | 5 | **71** | Must |
| M | MCP server (`audit_url`) | 4 | 3 | 2 | 4 | 5 | **71** | Must |
| N | Report redesign as defect schedule (P3) | 3 | 4 | 3 | 3 | 5 | **69** | Should |
| O | PDF export (print sheet) | 2 | 4 | 2 | 5 | 5 | **68** | Should |
| P | Brand/entity presence (Wikipedia, Wikidata, sameAs) | 3 | 3 | 3 | 4 | 5 | **68** | Should |
| Q | Public API docs | 2 | 3 | 2 | 5 | 5 | **63** | Should |
| R | Trust pages — sample report, glossary, honest "vs alternatives", byline | 2 | 3 | 4 | 4 | 4 | **63** | Should |
| S | Buyer-intent prompt generator | 3 | 3 | 2 | 4 | 2 | **59** | Later |
| T | Score badge / embeddable widget | 3 | 2 | 1 | 4 | 5 | **57** | Later |
| U | Share links (needs storage) | 2 | 4 | 2 | 3 | 2 | **54** | Later (with accounts) |
| V | History, re-audits, alerts (needs accounts) | 2 | 4 | 2 | 2 | 1 | **48** | Later (with accounts) |
| — | `.well-known/ai.txt` / `/ai/summary.json` scoring | 1 | 1 | 1 | 5 | 5 | 44 | **Rejected** — no engine reads them |
| — | Agent-readable proxy (Scrunch AXP) | 2 | 2 | 1 | 1 | 3 | 35 | **Rejected** — different product |

## Build order (dependencies first, keys last)

| Step | Ships | Needs from Rohith |
|---|---|---|
| 1 | A + F — accurate crawler model, 24 bots | — |
| 2 | B — projected score, fix-first plan | — |
| 3 | L — keyword-stuffing check | — |
| 4 | G — crawler's-eye view | — |
| 5 | I + O — compare two surveys, PDF | — |
| 6 | H — site mode | — |
| 7 | E — crawler log analyser | — |
| 8 | M + Q — MCP endpoint, API docs | — |
| 9 | J — CLI + GitHub Action | npm account to publish |
| 10 | C — rewriter live | Anthropic key in Vercel |
| 11 | D → K — live citation check, then the study | Perplexity/OpenAI key, ~$10–20 |
| 12 | N + P + R — report redesign, entity presence, trust pages | optional headshot + bio |
| 13 | U + V — accounts, share links, history | Firebase config |

"Ahead of everybody" means, after step 11: the only free tool that rewrites, checks live citations, reads your crawler logs, runs in CI and from an AI agent, and publishes whether its score predicts citation.

## Status

| Step | State |
|---|---|
| 1 — accurate crawler model, 23 bots (A, F) | **Shipped** 27 Sep |
| 2 — projected score, fix-first plan (B) | **Shipped** 27 Sep |
| 3 — keyword-stuffing check (L) | **Shipped** 27 Sep |
| 4 — crawler's-eye view (G) | **Shipped** 27 Sep |
| 5 — compare two surveys, PDF (I, O) | **Shipped** 27 Sep |
| 6 — site mode (H) | **Shipped** 27 Sep |
| 7 — crawler log analyser (E) | **Shipped** 27 Sep |
| 8 — MCP endpoint, API docs (M, Q) | **Shipped** 27 Sep |
| 9 — CLI + GitHub Action (J) | **Built** — Action works from the repo; npm publish waits on an npm account |
| 10 — rewriter live (C) | Waiting on Anthropic key in Vercel |
| 11 — live citation check → study (D, K) | Waiting on Perplexity/OpenAI key + budget |
| 12 — report redesign, entity presence, trust pages (N, P, R) | **Shipped** 27 Sep — survey-sheet report with a numbered defect schedule; `entity-presence` check (Wikidata by official-website domain, n/a on shared platforms or when Wikidata does not answer); /sample, /glossary, /alternatives. Byline bio still waits on Rohith's own words |
| 13 — accounts, share links, history (U, V) | Waiting on Firebase config |
