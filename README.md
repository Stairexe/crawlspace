# Crawlspace

**A GEO audit engine.** Point it at a URL. It reads the page the way an AI assistant reads
it, scores how citable that page is to five engines *separately*, names the paragraphs an
assistant cannot lift, and rewrites them.

**Live:** https://crawlspace-geo.vercel.app · **Methodology:** [/methodology](https://crawlspace-geo.vercel.app/methodology)

---

## Why this exists

Roughly half of informational searches now end in an AI answer rather than a click. Being
*cited* in that answer has replaced being *ranked* as the thing that matters — and the two
are only loosely correlated: about 15% of AI Overview sources overlap with the traditional
top ten.

Free tools already tell you what is wrong with a page. None of them fix it. Crawlspace closes
the loop: **audit → rewrite the failing paragraph → re-score it with the same scorer → show
the real delta.**

## Three decisions that make it different

**1. Five scores, not one.** Google states plainly that AI-specific files and chunked content
are *not required* for AI Overviews. ChatGPT, Claude and Perplexity reward exactly those
things. One evidence pass runs through five weight vectors, so the same page can be an 81 for
one engine and a 44 for another — and that spread is the actionable part. A blended number
would have averaged it away.

**2. Blocked crawlers are a gate, not a deduction.** If robots.txt disallows every agent an
engine uses, that engine cannot cite the page at all. Its score is capped at 25 and the
report leads with the access problem instead of burying it under schema advice.

**3. Extractability outweighs the technical checklist.** Content-answer fit is roughly 55% of
ChatGPT citation likelihood, against ~12% for domain authority. Most tools weight technical
checks heavily because a regex over robots.txt is easy to automate and judging a paragraph is
not. Extractability carries 30 points here; machine readability and retrievability together
carry 24.

## How the scoring works

```
fetch → evidence → checks → 5 engine scores → findings
```

The page is fetched once, as a crawler receives it. That produces *evidence* — facts. Checks
read evidence and return a normalised value with the literal string they found, so every
number is verifiable against the page. Scoring reads check results only. No stage reaches
backwards and no check performs its own network request, so the same page always produces the
same score.

**Categories:** extractability 30 · answer structure 18 · evidence density 16 · machine
readability 14 · authority 12 · retrievability 10.

**Block scoring** — every paragraph, list and table of 12+ words is scored on
self-containment (.30), answer directness (.25), length band (.20), factual density (.15) and
readability (.10). Page extractability is the length-weighted mean.

Every weight is published at [/methodology](https://crawlspace-geo.vercel.app/methodology),
along with what the tool cannot measure and the one assumption that would invalidate the model.

## The rewrite layer

Rewrite instructions come from the Princeton GEO study (KDD 2024), which measured visibility
lift per tactic: cite sources +40%, statistics +37%, quotations +30%, authoritative tone +25%
— and keyword stuffing **−10%**, which is why a naïve "SEO rewrite" makes things worse.

The rewriter is forbidden from inventing a fact, figure, statistic, date, price, name, quote
or citation the source did not already contain. When a passage needs evidence the page does
not have, the tool says so and leaves that to the author. The only lift figure Crawlspace claims
as its own is the before/after re-score, which runs the rewritten text back through the
identical scorer.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npx tsc --noEmit
```

**Environment variables are all optional.** With none set, everything works except the
rewrite endpoint — the deterministic engine has no third-party dependency and no marginal
cost per audit. That is deliberate: the public deployment must be fully useful to someone who
brings no credentials, and must not spend the owner's API budget on strangers' traffic. Users
can paste their own key, which is held in the browser tab for the session and never persisted
server-side.

```bash
ANTHROPIC_API_KEY=        # enables the rewrite layer with Claude
OPENAI_API_KEY=           # or with GPT
CRAWLSPACE_DEFAULT_PROVIDER= # anthropic | openai
```

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · cheerio · direct `fetch` to
the Anthropic and OpenAI REST APIs · no database · Vercel.

No paid dependency. No storage — a report exists only in the tab that produced it, and
exports to Markdown or JSON.

## Security

`/api/audit` fetches a user-supplied URL server-side, which is an SSRF surface and is treated
as one: scheme allowlist, private and reserved IP ranges rejected **after DNS resolution and
again after every redirect**, three redirects maximum, a 10s timeout, a 2 MB response cap, and
per-IP rate limiting. See `lib/fetcher.ts`.

## Project documents

Built with a full groundwork pass before any code was written:

| | |
|---|---|
| [`research/SUMMARY.md`](research/SUMMARY.md) | The six findings that changed the build, with sources |
| [`research/scoring-model.md`](research/scoring-model.md) | The scoring spec the code implements |
| [`research/competitors.md`](research/competitors.md) | Where the incumbents stop, and the gap this fills |
| [`docs/PRD.md`](docs/PRD.md) | What it does and what is out of scope |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack choices with the alternatives each beat |
| [`DECISIONS.md`](DECISIONS.md) | What the interrogation cut, and the risk that was accepted |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Dependency-ordered task list |

## Limits, stated plainly

Crawlspace models citability — it does not confirm citation. It does not measure off-domain
presence (brands are cited ~6.5× more often through third parties than their own site),
backlinks, or domain authority, and it audits one URL at a time. Site-wide crawling and saved
reports were deliberately cut rather than half-built; see `DECISIONS.md`.

## Licence

MIT. Built by [Rohith Reddy](https://github.com/Stairexe).
