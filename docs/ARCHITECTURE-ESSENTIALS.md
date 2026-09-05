# Architecture Essentials — Crawlspace

Read this before every task. Rules only. Rationale lives in `ARCHITECTURE.md`.

## Stack
Next.js 15 App Router · TypeScript strict · Tailwind v4 · cheerio · direct fetch to
Anthropic/OpenAI REST · no database · Vercel.

## The pipeline — never reorder it
`fetch → Evidence → CheckResult[] → per-engine scores → findings`

Evidence is facts. Checks read Evidence only. Scoring reads CheckResults only.
No stage reaches backwards. No check performs I/O.

## Types
All four types live in `lib/types.ts`. Nothing else declares them. Change the type first,
then the code.

## Engines
`google-aio | chatgpt | perplexity | claude | copilot` — always five, always scored
separately. The composite is a derived secondary number and never the only one shown.

## Categories and base weights
extractability 30 · answer-structure 18 · evidence-density 16 · machine-readability 14 ·
authority 12 · retrievability 10. Weights live only in `lib/scoring/weights.ts`.

## Gates
Crawler access (per engine), reachability (all), renders-without-JS (all). A failed gate
hard-caps at 25 and leads the report. Never average a gate away.

## Hard rules
1. **The rewriter never invents facts.** No new statistics, citations, quotes, claims, or
   entities. It restructures and tightens source text only. Enforced in `lib/ai/prompts.ts`.
2. **Never keyword-stuff.** Measured −10% to AI visibility. Explicit negative constraint.
3. **Never claim lift the tool did not measure.** Published study figures are labelled as such.
4. **Every check returns literal `evidence`** the user can verify on their own page.
5. **Zero-key mode must stay fully functional** for everything except `/api/rewrite`.
6. **Validate the URL after DNS and after every redirect.** Private ranges rejected. This is
   an SSRF surface; treat it as one.
7. **No secrets to the client.** Server env vars stay server-side. User-supplied keys live in
   sessionStorage only and are never logged.

## Conventions
- Components: PascalCase in `components/`, one component per file, props typed inline.
- Lib: camelCase files, pure functions, named exports, no default exports outside `app/`.
- Check ids: `kebab-case`, stable forever — they are referenced in exports and findings.
- Errors: API routes return `{ error: string, code: string }` with a real status code.
  Never throw raw. Never leak a stack trace to the client.
- Tailwind: theme tokens in `app/globals.css` `@theme`. No arbitrary hex in components.

## Never do this
- Never add a database, auth, or account to v1.
- Never use `jsdom` or regex-parse HTML.
- Never fetch third-party URLs from the client.
- Never make the rewrite layer a hard dependency of the audit.
- Never ship a check without `evidence` and, if actionable, a `fix`.
