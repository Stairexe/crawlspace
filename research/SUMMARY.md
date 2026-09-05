# Research Summary — Crawlspace

Phase 1 output. These are the findings that changed the build. Everything downstream
(PRD, ARCHITECTURE, the scoring weights, the rewrite prompts) traces back to this file.

---

## The six findings that changed the plan

### 1. The score is the commodity. The rewrite is the product.

A free 0–100 GEO score already exists and is well executed. SEOmator's GEO Audit Tool
ships six weighted categories (E-E-A-T 22%, Technical SEO 20%, AI Citability 18%, Brand
Authority 18%, Platform Readiness 12%, Schema 10%), a 14-crawler robots.txt report,
llms.txt validation, block-level citability scoring, prioritised findings, and a PDF
export — with no signup.

**Implication:** building "another scanner" is a dead end. Every audit tool in this
category stops at *"here is what's wrong."* The gap is the closed loop:
**audit → rewrite the actual failing content → re-score the rewritten block and show the
delta.** That is the thing Crawlspace does that the incumbents do not, and it is the thing
worth putting on a résumé.

Source: [SEOmator GEO Audit Tool](https://seomator.com/geo-audit-tool)

---

### 2. Google says none of this is required. A single blended score is therefore wrong.

Google's own AI-features optimization guide states plainly that **no special markup,
AI files, or markdown are required** for AI Overviews or AI Mode; that you should **not
chunk content for AI**; and that writing separate AI-targeted content risks the
**scaled content abuse** spam policy. AI Overviews run on core Search ranking.

Meanwhile ChatGPT, Claude and Perplexity demonstrably *do* reward extractable structure,
`llms.txt`, FAQ JSON-LD and public machine-readable files.

**Implication — this is the core architectural decision of the product.** A tool that
reports one blended number is telling a half-truth to whichever engine it averaged away.
Crawlspace scores **per engine** (Google AI Overviews, ChatGPT, Perplexity, Claude, Copilot),
running the same evidence through five different weight vectors. The same site can be an
81 for Google and a 44 for Perplexity — and that spread is the actual insight.

No free competitor surfaces this correctly; SEOmator has a "Platform Readiness" category
worth 12%, which treats per-engine divergence as a sub-score rather than as the frame.

Source: [Google, AI features and your website](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

---

### 3. Content-answer fit is ~55% of citation likelihood. Technical checks are ~14%.

A ZipTie analysis of ~400,000 pages found that how closely a page's style and structure
match the AI's own answer format accounts for roughly **55%** of ChatGPT citation
likelihood — against **12%** for domain authority and **14%** for on-page structure.

**Implication:** most audit tools weight technical checks heavily because technical checks
are *easy to automate* — a regex over robots.txt is cheap, judging whether a paragraph
survives being lifted out of its page is not. That is backwards relative to the evidence.

Crawlspace inverts it: the deterministic technical layer is a **gate**, not the score. If the
crawlers are blocked, nothing else matters and the tool says so. Once the gate passes, the
weight moves to block-level extractability — measured per paragraph, on real page content.

---

### 4. The lift numbers per rewrite tactic are published and measured.

The Princeton GEO study (KDD 2024, evaluated against Perplexity) ranked nine optimization
methods by measured visibility lift:

| Method | Measured lift |
|---|---|
| Cite sources | +40% |
| Add statistics | +37% |
| Add quotations | +30% |
| Authoritative tone | +25% |
| Improve clarity | +20% |
| Technical terms | +18% |
| Unique vocabulary | +15% |
| Fluency optimization | +15–30% |
| **Keyword stuffing** | **−10%** |

Low-authority sites benefit most — up to **115%** visibility increase from citations alone.

**Implication:** the rewrite layer is not "ask an LLM to make this better." Its instruction
set is derived from a ranked, published table, and the projected lift Crawlspace displays is
attributable to a study rather than invented. That is a defensible claim in an interview.

---

### 5. Keyword stuffing actively *hurts*. The rewriter must be constrained against it.

Unlike traditional SEO, where stuffing is merely ineffective, the Princeton data shows it
reduces AI visibility by **10%**. A naïve "SEO rewrite" prompt produces exactly this.

**Implication:** the rewrite prompt carries explicit negative constraints — no keyword
repetition, no invented statistics, no fabricated citations, no claims not present in the
source. The rewriter restructures and tightens; it is forbidden from inventing facts. This
is a correctness requirement, not a style preference, and it is enforced in the prompt and
checked in the diff.

---

### 6. Brands are cited ~6.5× more often via third-party sources than via their own domain.

Wikipedia alone accounts for ~7.8% of ChatGPT citations, Reddit ~1.8%.

**Implication:** an audit that only looks at the domain is structurally incomplete, and
saying so honestly is a differentiator. Crawlspace's report ends with an off-domain presence
section that names the gap (Wikipedia, Reddit, review sites, YouTube, LinkedIn/GitHub)
rather than pretending an on-domain score is the whole picture.

---

## What did NOT change

- The 40–60 word self-contained answer block remains the single most reusable content unit.
- Blocked AI crawlers remain an absolute blocker: block the bot, lose the citation, full stop.
- FAQPage JSON-LD remains disproportionately valuable specifically for Perplexity.
- Freshness remains a real ChatGPT signal (~3.2× for content updated within 30 days).

## Per-engine crawler map (used by the technical gate)

| User agent | Engine it gates |
|---|---|
| `GPTBot`, `OAI-SearchBot`, `ChatGPT-User` | ChatGPT |
| `PerplexityBot`, `Perplexity-User` | Perplexity |
| `ClaudeBot`, `anthropic-ai`, `Claude-User`, `Claude-SearchBot` | Claude |
| `Google-Extended` | Gemini / AI Overviews grounding |
| `Bingbot` | Copilot |
| `CCBot` | Common Crawl — training only, safe to block |

## Sources

- [SEOmator — GEO Audit Tool](https://seomator.com/geo-audit-tool)
- [Google — AI features and your website](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Princeton GEO study, KDD 2024](https://arxiv.org/abs/2311.09735)
- [llmstxt.org](https://llmstxt.org)
- [State of AI Search 2026 — OrganiKPI](https://organikpi.com/blog/geo-ai-search/state-of-ai-search/)
- [State of llms.txt 2026 — Presenc AI](https://presenc.ai/research/state-of-llms-txt-2026)
- [AI SEO statistics 2026 — Position Digital](https://www.position.digital/blog/ai-seo-statistics/)
