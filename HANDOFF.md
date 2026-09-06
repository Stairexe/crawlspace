# Crawlspace — Website Visibility Command Center Handoff Guide

## 1. Executive Summary

**Crawlspace** has evolved from a single-pass GEO auditor into a comprehensive **Website Visibility Command Center** grounded in the strategic blueprint of [`ref/guides.txt`](file:///Users/jashu/Desktop/Projects/Web/crawlspace/ref/guides.txt) and the visual styling of [`ref/reference image.jpg`](file:///Users/jashu/Desktop/Projects/Web/crawlspace/ref/reference%20image.jpg).

It audits a webpage across every visibility layer:
1. **SEO (Search Fundamentals)**: Title & description length, single H1 & heading hierarchy, canonicals, OpenGraph & Twitter card previews, and indexability rules.
2. **GEO (Generative Engine Optimization)**: 5 individual engine citation scores (`Google AI Overviews`, `ChatGPT`, `Perplexity`, `Claude`, `Copilot`), deixis detection, and Princeton GEO rewrite tactics.
3. **AI Crawler Center**: Matrix separating **AI Search Crawlers** (`OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Bingbot`, `Googlebot`) from **AI Training Scrapers** (`GPTBot`, `CCBot`, `Google-Extended`), with plain-English status.
4. **Technical Health**: HTTPS security, server response latency, HTML payload byte weight, viewport detection, and SSR validation.
5. **Content Intelligence**: Word count volume, reading grade level, question headings answered, factual signal density, and outbound citation domains.
6. **Schema & Structured Data**: Detection of 10+ JSON-LD types (`Organization`, `WebPage`, `Article`, `FAQPage`, etc.), validation of missing properties (e.g. `sameAs`, `brand`), and a syntax-highlighted JSON-LD viewer with copy button.
7. **Robots.txt Rule Explainer**: Rule-by-rule plain-English translations for all directives.
8. **Turnkey LLM Export**: One-click **"Copy LLM Prompt"** for ChatGPT / Claude with step-by-step code remediation, plus JSON and Markdown downloads.

---

## 2. Quickstart & Local Execution

### 2.1 Starting the Development Server
The application runs locally on:
- **Local URL**: [http://localhost:3000](http://localhost:3000)
- **Methodology Page**: [http://localhost:3000/methodology](http://localhost:3000/methodology)

To restart or run manually in the terminal:
```bash
# 1. Install dependencies
npm install

# 2. Start Next.js local development server (port 3000)
npm run dev

# 3. Typecheck & verification
npx tsc --noEmit
npm run build
```

---

## 3. Where to Put API Keys

Crawlspace was architected with a strict **Zero-Key Principle**:
> **Every single core feature** (auditing, block extraction, scoring, gate checks, findings, file generator, and export) works **without any API key**.
> API keys are **only** required for the `/api/rewrite` feature (rewriting weak blocks).

There are **two ways** to provide API keys:

### Option A: Server Environment File (Recommended for Local Dev & Deployments)
Create a `.env.local` file in the project root directory:
```bash
touch .env.local
```
Add the following keys:
```env
# Anthropic Claude Key (used for claude-sonnet-4-5)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI Key (used for gpt-4.1-mini)
OPENAI_API_KEY=sk-proj-...

# Default provider to prefer when both keys exist: "anthropic" or "openai"
CRAWLSPACE_DEFAULT_PROVIDER=anthropic
```
*Note: Next.js automatically reloads `.env.local` on server restart.*

### Option B: Direct in Browser UI (Zero-Storage / Client-Provided)
If no server environment keys are configured:
1. Open the homepage at `http://localhost:3000`.
2. Directly underneath the URL input box, click the collapsible section:
   **`› REWRITE LAYER: the audit runs without a key — add one to rewrite passages`**.
3. Choose the provider (**Anthropic** or **OpenAI**) and paste your API key into the input.
4. **Security Guarantee**:
   - The key is saved strictly in the browser tab's `sessionStorage`.
   - It is never written to disk, never logged to server logs, and never stored in any database.
   - It is sent in the JSON payload to `/api/rewrite` strictly for that one rewrite request.

---

## 4. End-to-End System Architecture

```
User URL Input
      │
      ▼
[/api/audit]
      │
      ├── 1. SSRF & Security Validation (`lib/fetcher.ts`)
      │      ├── Scheme allowlist (HTTP/HTTPS)
      │      ├── DNS lookup & Private IP rejection (post-DNS)
      │      └── Redirect verification (max 3, re-checked against private IPs)
      │
      ├── 2. Raw Evidence Extraction (`lib/extract.ts`)
      │      ├── Fetch HTML (2MB cap, 10s timeout, cheerio parse)
      │      ├── Parallel soft-fetches: /robots.txt, /llms.txt, /sitemap.xml
      │      ├── HTML text-to-code ratio & JS-render detection
      │      ├── Schema.org JSON-LD extraction & Microdata
      │      └── Block Segmentation (`lib/blocks.ts`)
      │
      ├── 3. Deterministic Checks (`lib/checks/`)
      │      ├── `crawlers.ts`: 12 AI agents checked across 5 engines
      │      ├── `content.ts`: Question headings, lists, tables, FAQ pairs
      │      └── `technical.ts`: Meta tags, canonical, title, latency, semantics
      │
      ├── 4. Engine Multipliers & Gate Caps (`lib/scoring/`)
      │      ├── 6 Base Categories (Sum = 100)
      │      ├── Per-Engine Multipliers (ChatGPT, Claude, Perplexity, Google AIO, Copilot)
      │      └── Gate Checks (Hard cap at 25 if crawler is blocked or JS shell detected)
      │
      └── 5. Output Report (`AuditReport`)
             ├── Engine Scores (5 individual scores + composite + spread)
             ├── Ranked Actionable Findings (Severity × Effort)
             ├── Weakest Content Blocks (< 0.75 score)
             └── Contextual Summary

      │
      ├── User selects a weak block to improve
      ▼
[/api/rewrite]
      ├── `lib/ai/prompts.ts`: Princeton GEO Study tactics applied
      ├── Strict negative constraints: FORBIDDEN to invent facts, stats, citations
      ├── Call model (`claude-sonnet-4-5` or `gpt-4.1-mini`)
      ├── Re-score rewritten block using identical deterministic block scorer
      └── Return before vs. after score delta & applied tactics

      │
      ├── User requests technical assets
      ▼
[/api/generate]
      ├── Generate valid `llms.txt`
      ├── Generate missing Schema.org JSON-LD (Organization, WebPage, FAQPage)
      └── Generate recommended `robots.txt`
```

---

## 5. Scoring & Methodology Breakdown

### 5.1 The 6 Scoring Categories (Base Weights)
1. **Extractability (30 points)**:
   - Evaluates whether content blocks can be lifted out of context and quoted cleanly by an LLM without missing pronouns, vague antecedents, or dangling cross-references.
   - Based on Princeton GEO research finding that content-answer fit drives ~55% of citation likelihood.
2. **Answer Structure (18 points)**:
   - Question headings (`What is...`, `How to...`), direct answers in the opening sentence, tables, and structured lists.
3. **Evidence Density (16 points)**:
   - Specific statistics, percentages, years, currency, named sources, and blockquotes.
4. **Machine Readability (14 points)**:
   - JSON-LD schemas, presence and validity of `/llms.txt`, clear semantic HTML (`<main>`, `<article>`), and `/sitemap.xml`.
5. **Authority Signals (12 points)**:
   - Named author entity, author bio, Organization schema, and visible updated dates.
6. **Retrievability (10 points)**:
   - Title tag length/relevance, meta description, canonical URL, heading hierarchy (single H1, valid H2/H3 nesting), and HTML response size.

### 5.2 The 5 Engine Personalities
Each engine multiplies the base categories differently:
- **Google AI Overviews**: Relies heavily on traditional Google Search ranking and E-E-A-T. AI-specific files (`llms.txt`) are *not required*, so machine readability has lower penalty, while Authority (1.4×) and Evidence (1.1×) are weighted higher.
- **ChatGPT**: Prioritizes extractability (1.3×) and answer structure (1.2×). Citations are heavily tied to matching the exact shape of an answer.
- **Perplexity**: The most structure-sensitive engine (1.3× structure, 1.3× machine readability). Rewards FAQPage schema, lists, and atomic paragraphs.
- **Claude**: Highly selective citations, rewarding factual density (1.5× multiplier) — numbers, named entities, and verifiable claims.
- **Copilot**: Grounded on Bing index; sensitive to page retrieval speeds, clean HTML semantics, and traditional retrievability (1.3×).

### 5.3 Hard Gates (Caps at 25)
If any of these conditions are met, the score is capped at **25** (a failed gate cannot be averaged away into a passing grade):
1. **Crawler Access Blocked**: robots.txt blocks all agents for that engine.
2. **Page Unreachable**: Server returns non-200 HTTP code.
3. **Client-Side JS Shell**: Server returns empty HTML (<200 words) where content requires JavaScript execution.

---

## 6. Block-Level Analysis (`lib/blocks.ts`)

Every paragraph, list, table, or FAQ item with 12+ words is isolated and scored on 5 dimensions:
1. **Self-Containment (30%)**:
   - Heavily penalizes block-initial **deixis** (`as mentioned above`, `this`, `that`, `these`, `it`, `they`, `furthermore`) if the antecedent is not in the same block.
2. **Answer Directness (25%)**:
   - Rewards assertive opening verbs (`is`, `means`, `requires`, `delivers`).
   - Penalizes preambles (`In this article we will explore...`, `Have you ever wondered...`).
3. **Length Band (20%)**:
   - Optimal citation size: 40–60 words (concise answer) or 130–170 words (in-depth passage). Penalizes fragments (<15 words) and overly long text (>220 words).
4. **Factual Density (15%)**:
   - Frequency of numbers, percentages, dates, proper nouns, and attributions (`according to`, `study found`).
5. **Readability (10%)**:
   - Flesch-Kincaid grade level (target: grades 7–12; penalizes sentences >30 words).

---

## 7. The AI Rewrite Engine (`lib/ai/`)

When a user clicks "Rewrite" on a failing block:
1. **Princeton Tactics**: Applies empirical GEO tactics (source citation +40%, statistics +37%, quotation +30%, authoritative phrasing +25%).
2. **Strict Guardrails**: Negative constraints in `lib/ai/prompts.ts` strictly prohibit introducing new statistics, fake citations, invented quotes, or keyword stuffing (-10% citation penalty).
3. **Deterministic Verification**: Once rewritten, the text is run back through the local block scorer to compute the genuine before/after score delta.

---

## 8. Key Directories and Files

```
├── app/
│   ├── api/
│   │   ├── audit/route.ts       # POST /api/audit (SSRF-guarded crawl & score)
│   │   ├── generate/route.ts    # POST /api/generate (llms.txt, JSON-LD, robots.txt)
│   │   └── rewrite/route.ts     # POST & GET /api/rewrite (AI rewriting layer)
│   ├── methodology/page.tsx     # Full public methodology documentation
│   ├── globals.css              # Tailwind v4 theme tokens
│   ├── layout.tsx               # Root layout & meta tags
│   └── page.tsx                 # Main client application (audit UI, results, rewrite)
├── components/
│   ├── Blocks.tsx               # Content block breakdown & rewrite trigger
│   ├── Findings.tsx             # Ranked findings (severity, effort, fixes)
│   ├── Generated.tsx            # File generator modal / viewer
│   ├── ScoreBoard.tsx           # 5-engine score cards, composite, and category bars
│   └── primitives.tsx           # Shared UI badges, progress bars, buttons
├── lib/
│   ├── ai/                      # Provider clients (Anthropic/OpenAI) and prompts
│   ├── checks/                  # Content, Crawler, and Technical check definitions
│   ├── scoring/                 # Base weights, engine multipliers, calculation logic
│   ├── blocks.ts                # Paragraph deixis & extractability scoring
│   ├── export.ts                # Markdown and JSON report downloaders
│   ├── extract.ts               # Cheerio DOM extractor & parallel probe
│   ├── fetcher.ts               # SSRF-guarded HTTP fetcher
│   ├── robots.ts                # Robots.txt parser for 12 AI agents
│   └── types.ts                 # Single source of truth for TypeScript types
└── CLAUDE.md                    # Core project rules & constraints
```

---

## 9. Non-Negotiable Rules & Invariants (From `CLAUDE.md`)

When maintaining or extending this codebase:
1. **SSRF Guard**: Never weaken `lib/fetcher.ts`. Private network IP verification must happen after DNS resolution and after every redirect.
2. **Zero-Key Operational Rule**: Never make auditing depend on an API key. Zero-key mode must remain 100% functional.
3. **No Fact Invention**: Never alter rewrite prompts to allow inventing fake statistics or facts.
4. **Gates are Hard Caps**: Never average a failed gate into a passing score.
5. **No DB / Auth in v1**: Crawlspace is an ephemeral tool. Results live only in browser memory and export to Markdown/JSON.
