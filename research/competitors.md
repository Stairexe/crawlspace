# Research — Competitive Landscape

## Direct competitors (free / freemium GEO audit)

| Tool | What it does | Where it stops |
|---|---|---|
| **SEOmator GEO Audit** | 0–100 score, 6 weighted categories, 14-crawler robots report, llms.txt validation, block-level citability, PDF + shareable URL, no signup, up to 50 pages | Diagnoses only. No rewrite. One blended score frames per-engine readiness as a 12% sub-category. |
| **ailabsaudit / Mentionable / Minineo** | Comparison-grade platforms; tracking-first (share of voice, prompt monitoring) | Priced platforms aimed at teams with budget; monitoring rather than fixing |
| **Presenc AI, OrganiKPI** | Research and benchmark publishers with light tooling | Data, not a per-site audit loop |
| **Otterly, Peec, ZipTie, LLMrefs** | AI visibility *monitoring* — do you get cited, by whom, vs competitors | Adjacent, not competing. They watch; they do not audit or fix a page. |

## The honest read

The audit-and-score space is **crowded and already free**. Monitoring is where the money
is and it needs live API spend against five engines — out of reach for a zero-budget build.

The unoccupied slot is between them: **the fix**. Everyone reports; nobody rewrites the
failing block, re-scores it, and hands back a diff. That gap is small enough for one person
to build and specific enough to be legible on a résumé.

## Positioning

> Crawlspace is not a GEO tracker and not another scanner. It is a **closed-loop optimiser**:
> it finds the specific paragraphs an AI assistant cannot lift, rewrites them, and proves
> the improvement by re-scoring the rewrite with the same engine.

## What deliberately stays out of scope

- Prompt/citation monitoring across live engines — needs sustained paid API access
- Multi-page crawls beyond a small budgeted set — needs a queue and storage
- Backlink and domain-authority data — needs a paid data provider (Ahrefs/Semrush)
- Anything claiming to *guarantee* citation — unprovable, and the space is full of it
