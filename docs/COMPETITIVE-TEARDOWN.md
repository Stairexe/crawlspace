# Crawlspace — competitive teardown and build plan

*Researched 27 Sep 2026 from each tool's own public pages. Prices are published starting prices.*

## The field in one line each

| Tool | What it actually is | Price | Closest to us? |
|---|---|---|---|
| **SEOmator GEO Audit** | Free auditor. 1 URL → 0–100 GEO score from 6 weighted categories, block-level citability, 5 per-engine readiness scores, 14 AI crawlers, JSON-LD fixes. Quick scan (~5 s) or full crawl of up to 50 pages (2–3 min). PDF export, share URL, "compare two audits". Prints its full formula. | Free, no signup; account adds history, alerts, re-audits | **Yes — nearly identical** |
| **GEO Optimizer (GitHub Action)** | MIT open-source Python CLI + GitHub Action. 8 categories /100, 27 AI bots, `min-score` fails the build, SARIF into GitHub's Security tab, history + regression + "drift" detection, sitemap batch audits, 16 commands incl. `fix`. | Free | Yes, for developers |
| **ClayHog** | Free auditor, 8 dimensions (crawlers, llms.txt, schema, technical incl. SSR, E-E-A-T, citability, brand presence, platform readiness per engine). Homepage only. Bands: 80+ / 65–79 / 50–64 / <50. | Free; upsell to monitoring trial | Yes |
| **GEO Auditor** | Free, 14 signals, 5 pillars, per-engine scores for ChatGPT/Perplexity/Gemini, sample report link, cites the Princeton paper, glossary. | Free | Yes |
| **Geoptie** | Free audit, 6 dimensions, one unified score; a *suite* of small free tools (visibility checker, rank tracker, content checker, keyword finder). | Free; paid monitoring | Partly |
| **AEO Engine** | Free audit as a lead magnet for an agency ("Book a strategy call"). **Embeddable widget** other sites can put on their pages. | Free; agency upsell | Partly |
| **Citivra** | *Brand-first*: you enter brand + category + competitors; it generates buyer-intent prompts, reports mentions, share of voice, who gets cited — then diagnoses the technical cause. Weighted 100-pt technical score. | Free | Different angle |
| **Otterly.AI** | Paid tracker: your prompts run across 7 engines, reports mentions, share of voice, citations, position, sentiment; content audit; API. | $29/mo | No (tracker) |
| **Peec AI** | Paid tracker: each prompt runs every 24 h; visibility, position, sentiment, "used vs cited" sources; CSV, Looker Studio, REST API, **MCP server**. | $95/mo | No (tracker) |
| **Profound** | Enterprise "AI marketer": prompt volumes, crawler-log analytics, content agents that rewrite decaying pages, ChatGPT Shopping. | $99/mo+ (enterprise) | No |
| **Scrunch** | Tracker + **AXP**: serves AI bots a separate agent-readable version of your site. | $300/mo | No |

**Honest read:** "free, no-signup, per-engine GEO audit" is now a commodity. SEOmator does it with a 50-page crawl and history. Crawlspace cannot win on the audit alone.

## What they all do that we don't (and whether to copy it)

| Pattern | Who | Verdict |
|---|---|---|
| Multi-page crawl via sitemap (25–50 pages) | SEOmator, GEO Optimizer | **Build** — client-side, one page per request, no timeout risk |
| Share link + "compare two audits" | SEOmator | **Build** compare now (from exported JSON, no storage); share links with accounts |
| PDF export | SEOmator, Otterly | **Build** — print stylesheet, 1 day |
| Projected score ("fix these 3 → 71") | SEOmator | **Build** — ours can be exact: re-score with those checks passing |
| More AI crawlers (we check 13; they check 14 / 27) | SEOmator, GEO Optimizer | **Build** — add verified tokens only |
| CI: CLI + GitHub Action with `min-score`, SARIF | GEO Optimizer | **Build** — best fit for an open-source dev tool |
| MCP server | Peec | **Build** — one `audit_url` tool; cheap and very current |
| Live prompt checks: is the page actually cited? | Citivra, Otterly, Peec | **Build (needs API key)** — this also powers the validation study |
| Brand / off-site presence (Wikipedia, Wikidata, sameAs) | SEOmator, ClayHog | **Build light** — free Wikipedia/Wikidata lookup, labelled as a signal |
| Negative signals (keyword stuffing etc.) | GEO Optimizer | **Build** — Princeton measured −10% for stuffing |
| Embeddable score badge / widget | AEO Engine | **Build** — growth loop |
| History, scheduled re-audits, alerts | SEOmator, all trackers | **Build with accounts (Firebase)** |
| AI crawler log analysis (which bots actually hit you) | Profound | **Later** — parse an uploaded log in the browser, nothing stored |
| `.well-known/ai.txt`, `/ai/summary.json` | GEO Optimizer | **Don't reward** — no engine has said it reads them; report as "unverified" at most |
| Agent-readable page proxy | Scrunch | **Skip** — infrastructure product, not ours |
| Landing trust: reviewer byline + photo, sample report, how-it-works steps, glossary, "vs alternatives" page | SEOmator, GEO Auditor, ClayHog | **Build** — no invented testimonials, logos or user counts |

## Where Crawlspace is already ahead (keep leading with these)

1. **It fixes, not just flags.** Nobody free rewrites passages; we rewrite under a no-invented-facts constraint and re-score the rewrite. *(Needs the API key to go live.)*
2. **Gates, not averages.** A blocked engine is capped and marked "not inspected". Competitors blend it into a respectable number.
3. **Every weight published and in code.** SEOmator prints a formula; we publish the per-engine vectors and the source file.
4. **No fabricated proof.** Competitors lean on "3–9× ROI", "920% growth", logo walls. We show a live specimen.
5. **Open source.**

## The gap nobody fills

No tool here publishes evidence that its score predicts real citations. **The validation study** (≈150 real queries → which URLs ChatGPT/Perplexity cite → does our score separate cited from uncited pages) is the single most defensible thing Crawlspace can own. It reuses the live-prompt-check code.

## Build plan

**Wave 1 — no input needed from Rohith (≈1 week)**
1. Projected score + "fix first" order in every report
2. PDF export (print stylesheet)
3. Compare two surveys (drop two exported JSONs)
4. Crawlers: 13 → ~25 verified user-agent tokens
5. Negative-signal checks (keyword stuffing, boilerplate)
6. Site mode: sitemap → up to 25 pages, aggregated table
7. Trust pages: sample report, glossary, honest "Crawlspace vs alternatives", byline

**Wave 2 — needs API keys + a small budget**
8. Rewriter live (Anthropic key in Vercel)
9. "Is it cited?" live check via Perplexity Sonar (returns citations) and/or OpenAI web search
10. Validation study → publish results on /methodology

**Wave 3 — developer reach**
11. `npx crawlspace <url>` CLI + GitHub Action (`min-score`, SARIF, PR annotations)
12. MCP server (`audit_url`) + documented public API
13. Score badge / embeddable widget

**Wave 4 — needs accounts (Firebase)**
14. Share links, history, score-over-time, weekly re-audit + email alert

## What's needed from Rohith

| Needed | For | When |
|---|---|---|
| `ANTHROPIC_API_KEY` added in Vercel (never paste it in chat) | Rewriter | Wave 2 |
| Perplexity API key (Sonar) and/or OpenAI key, in Vercel | Live citation checks + study | Wave 2 |
| ~$10–20 API budget | Validation study | Wave 2 |
| npm account (free) | Publishing the CLI | Wave 3 |
| Firebase web config (safe to paste) | Accounts, history | Wave 4 |
| Optional: headshot + one-line bio | Byline trust signal | Wave 1 |
| Run `git push` after each wave | Deploy (the sandbox can't auth to GitHub) | Every wave |

## Sources
- SEOmator GEO audit — https://seomator.com/geo-audit-tool
- Geoptie — https://geoptie.com/free-geo-audit
- AEO Engine — https://aeoengine.ai/geo-audit
- ClayHog — https://www.clayhog.com/tools/geo-audit
- Citivra — https://citivra.com/
- GEO Auditor — https://geo-audit-tool.com/
- GEO Optimizer Action — https://github.com/marketplace/actions/geo-optimizer-audit
- Otterly — https://otterly.ai/ · Peec — https://peec.ai/ · Profound — https://www.tryprofound.com/
- Scrunch AXP — https://scrunch.com/faqs/what-is-scrunch-agent-experience-platform-axp-and-how-does-it-work
- Pricing comparison — https://www.get-ryze.ai/blog/ai-visibility-tools-pricing-compared-2026
