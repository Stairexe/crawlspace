# Crawlspace — agent instructions

A GEO audit engine: point it at a URL, it measures how crawlable and citable that page is
to AI assistants, rewrites the paragraphs they cannot use, and scores it per engine.

## Read before any task
1. `docs/ARCHITECTURE-ESSENTIALS.md` — the rules
2. `research/scoring-model.md` — the spec the scoring code implements
3. `docs/ARCHITECTURE.md` — only when you need to know *why*

## Run
```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # must pass before any commit
npm run lint
npx tsc --noEmit     # strict; zero errors required
```

## Test
There is no test runner in v1. Verification is:
```bash
npm run build && npx tsc --noEmit
curl -s -X POST localhost:3000/api/audit -H 'content-type: application/json' \
  -d '{"url":"https://example.com"}' | head -c 400
```
Audit at least one content-rich real site and one deliberately hostile one (JS-only SPA,
robots-blocked) before calling a scoring change done.

## Environment
All optional. With none set, everything except `/api/rewrite` and accounts works — keep it that way.
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
CRAWLSPACE_DEFAULT_PROVIDER=anthropic
AUTH_SECRET=              # signs session cookies (accounts)
BLOB_READ_WRITE_TOKEN=    # Vercel Blob, private store (accounts); dev falls back to ./.data/
```

## Conventions
- `lib/types.ts` is the single source of truth for types. Change it first.
- Pure functions in `lib/`, named exports, no I/O inside checks.
- Check ids are `kebab-case` and permanent — exports reference them.
- Weights change in `lib/scoring/weights.ts` and nowhere else.
- API routes return `{ error, code }` with a real status. Never leak stack traces.
- Tailwind theme tokens in `app/globals.css`. No arbitrary hex in components.
- Design language: firecrawl.dev — off-white ground, hairline frame, one orange accent,
  Geist + Geist Mono, bracket labels. Motion is GSAP (`components/Motion.tsx`) and three.js
  (`components/HeroGlobe.tsx`); both pause off-screen and respect reduced motion.
- Storage goes through `lib/store.ts` only; account logic lives in `lib/accounts.ts`.

## Never touch
- **Never weaken the SSRF guards in `lib/fetcher.ts`.** Private-range rejection happens after
  DNS and after every redirect. If a fetch fails, fix the caller, not the guard.
- **Never let the rewriter invent facts.** No new statistics, citations, quotes or claims.
  The negative constraints in `lib/ai/prompts.ts` are correctness requirements.
- **Never make the audit depend on an API key.**
- **Never average a failed gate into a passing score.**
- **Never make an audit depend on an account or on storage.** Accounts (D8) only add history
  and share links; `/api/audit` saves best-effort and still answers if saving fails.
- **Never store a user's rewrite key server-side**, and never return `passwordHash` to a client.

## Commit
Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`). One concern per commit.
`npm run build` must pass first.
