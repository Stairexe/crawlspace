# Architecture — Crawlspace

## 1. Stack

| Layer | Choice | Beat | Why |
|---|---|---|---|
| Framework | **Next.js 15, App Router** | Remix; plain Vite SPA | Needs a server to fetch third-party URLs (CORS makes a pure SPA impossible) and Vercel deploys it with zero config. Route Handlers give the API without a second service. |
| Language | **TypeScript, strict** | JavaScript | The evidence → check → score pipeline is all typed data structures; the types *are* the spec. |
| Styling | **Tailwind CSS v4** | CSS Modules; styled-components | Single PostCSS plugin, no runtime, no build fragility. Design tokens live in `@theme`. |
| HTML parsing | **cheerio** | jsdom; regex | jsdom is heavy and slow in a serverless function. Regex over HTML is how you get subtly wrong answers. cheerio is ~10x lighter than jsdom and sufficient — we never need a live DOM. |
| LLM access | **Direct `fetch` to Anthropic + OpenAI REST** | Vendor SDKs; Vercel AI SDK | Two providers behind one 60-line interface, no SDK version churn, no bundle weight. Swapping in a third provider is one file. |
| Persistence | **None** | Postgres; KV; Blob | v1 audits are ephemeral. Adding storage means accounts, retention, and a privacy policy — all cost, no v1 value. Export covers the real need. |
| Hosting | **Vercel** | Netlify; Cloudflare Pages | Free tier, already connected to the GitHub account, Node runtime for the audit route. |

Everything above is free-tier or open source. No paid dependency in v1.

## 2. Runtime shape

```
Browser
  └─ POST /api/audit        { url }
        ├─ fetch page HTML          (AI-crawler UA, 10s timeout, 2MB cap)
        ├─ fetch /robots.txt
        ├─ fetch /llms.txt
        ├─ fetch /sitemap.xml       (HEAD only — existence check)
        └─ extract  → Evidence
             └─ runChecks(Evidence) → CheckResult[]
                  └─ score(CheckResult[]) → { engines: EngineScore[5], composite, findings }
        ← AuditReport (JSON)

  └─ POST /api/rewrite      { block, context, provider, apiKey? }
        ├─ buildPrompt(block, failingSubScores)   ← Princeton GEO tactic set
        ├─ call provider
        └─ scoreBlock(rewritten) → delta
        ← { rewritten, before, after, tacticsApplied, delta }

  └─ POST /api/generate     { kind: 'llms.txt' | 'jsonld', evidence }
        └─ deterministic template fill — no model needed
```

The audit route runs on the **Node.js runtime** (not Edge): it needs full `fetch` semantics,
`cheerio`, and a longer timeout than Edge comfortably gives.

## 3. Data model

The whole product is four types. They live in `lib/types.ts` and nothing else defines them.

```ts
type Evidence = {
  url: string; finalUrl: string; status: number; fetchedAt: string;
  timings: { totalMs: number };
  html: { title, metaDescription, canonical, lang, htmlBytes, textWords };
  headings: { level: 1|2|3|4|5|6; text: string }[];
  blocks: ContentBlock[];
  jsonLd: { type: string; raw: unknown }[];
  microdata: string[];
  robots: { found: boolean; raw: string; rules: Record<string, RobotRule> };
  llmsTxt: { found: boolean; raw?: string; valid?: boolean; issues: string[] };
  sitemap: { found: boolean };
  links: { internal: number; external: number; externalCitations: number };
  media: { images: number; withAlt: number };
  dates: { published?: string; modified?: string };
  author: { name?: string; hasSchema: boolean; hasBio: boolean };
  semantics: { main: boolean; article: boolean; nav: boolean; h1Count: number };
  renderedWithoutJs: boolean;
};

type ContentBlock = {
  id: string; kind: 'paragraph'|'list'|'table'|'faq'|'heading-lead';
  heading?: string; text: string; words: number; domPath: string;
  scores: BlockScores;            // the five sub-scores + weighted total
};

type CheckResult = {
  id: string; category: Category; label: string;
  status: 'pass'|'warn'|'fail'|'na';
  value: number;                  // 0..1, the normalised contribution
  gate?: Engine[] | 'all';        // present only on gate checks
  evidence: string;               // literal, quotable, verifiable
  fix?: { summary: string; detail: string; effort: Effort; rewritable?: boolean };
  engines?: Engine[];             // which engines this actually affects
};

type AuditReport = {
  evidence: Evidence;
  checks: CheckResult[];
  engines: Record<Engine, { score: number; capped: boolean; capReason?: string;
                            categories: Record<Category, number> }>;
  composite: number;
  findings: Finding[];            // sorted by severity × engines affected
  weakestBlocks: ContentBlock[];
};
```

`Engine = 'google-aio' | 'chatgpt' | 'perplexity' | 'claude' | 'copilot'`
`Category = 'extractability' | 'answer-structure' | 'evidence-density' | 'machine-readability' | 'authority' | 'retrievability'`

## 4. Folder structure

```
app/
  layout.tsx                 root shell, fonts, theme tokens
  page.tsx                   the tool — input, score, findings, rewrite
  methodology/page.tsx       published weights, sources, limits
  api/
    audit/route.ts           POST — the deterministic pipeline
    rewrite/route.ts         POST — the AI layer
    generate/route.ts        POST — llms.txt + JSON-LD generation
components/
  ScanForm.tsx               URL input + state machine
  ScoreDial.tsx              composite score, animated
  EngineBars.tsx             the five per-engine scores + spread
  CategoryGrid.tsx           six category breakdown
  FindingsList.tsx           prioritised findings, expandable evidence
  BlockCard.tsx              a weak block + its sub-scores + rewrite trigger
  RewritePanel.tsx           before/after diff + delta + tactics applied
  GeneratedFiles.tsx         llms.txt / JSON-LD output with copy
  Methodology.tsx            shared methodology content
lib/
  types.ts                   the four types above — single source of truth
  fetcher.ts                 guarded fetch: SSRF blocklist, timeout, size cap, redirects
  extract.ts                 HTML → Evidence (cheerio)
  blocks.ts                  Evidence → ContentBlock[] + block sub-scores
  robots.ts                  robots.txt parser + per-UA resolution
  checks/
    index.ts                 the check registry
    crawlers.ts              gate: AI user-agent access
    extractability.ts        block-derived checks
    structure.ts             headings, tables, lists, FAQ, direct answers
    evidence.ts              stats, citations, quotes, dates
    machine.ts               JSON-LD, semantics, llms.txt, sitemap
    authority.ts             author, credentials, freshness, org schema
    retrieval.ts             title, meta, canonical, hierarchy, links, weight
  scoring/
    weights.ts               base weights + the five engine multipliers
    score.ts                 CheckResult[] → AuditReport
    severity.ts              finding severity from weight × engines
  ai/
    provider.ts              one interface, Anthropic + OpenAI implementations
    prompts.ts               rewrite instruction set (Princeton tactics + negatives)
  generate/
    llmstxt.ts               deterministic llms.txt from Evidence
    jsonld.ts                deterministic JSON-LD from Evidence
```

## 5. Security posture

The audit route takes a user-supplied URL and fetches it server-side. That is an SSRF
surface and is treated as one:

- Scheme allowlist: `http`, `https` only
- Reject any host resolving to a private or reserved range (10/8, 172.16/12, 192.168/16,
  127/8, 169.254/16, `::1`, unique-local) — checked **after** DNS resolution, and again
  after every redirect
- Max 3 redirects, each re-validated
- 10s timeout, 2 MB response cap, `Accept: text/html` only
- No response body is echoed back verbatim beyond the quoted evidence strings
- Rate limit: in-memory token bucket per IP (10 audits / 10 min) — adequate for the traffic
  a portfolio piece sees, and honest about being in-memory

API keys: read from `process.env` server-side, never sent to the client. A user-supplied key
is accepted per-request, held only in React state and `sessionStorage`, never logged, never
persisted server-side.

## 6. Performance budget

| Stage | Budget |
|---|---|
| Page fetch | 10s hard timeout, typically < 2s |
| Parse + extract | < 200ms for a 2MB document |
| Checks + scoring | < 50ms (pure functions over in-memory data) |
| Total `/api/audit` p50 | < 8s |
| First contentful paint | < 1.5s (no client-side data fetching on load) |

## 7. Environments

| | |
|---|---|
| Local | `npm run dev`, `.env.local` optional |
| Preview | every push to a non-production branch |
| Production | `main` → Vercel, team `rohith-s-projects07` |

Environment variables, all optional:

- `ANTHROPIC_API_KEY` — enables the rewrite layer with Claude
- `OPENAI_API_KEY` — enables it with GPT
- `CRAWLSPACE_DEFAULT_PROVIDER` — `anthropic` | `openai`

With none set, the deployment runs in deterministic-only mode by design.
