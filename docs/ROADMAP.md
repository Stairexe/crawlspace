# Roadmap — Crawlspace

Dependency-ordered. Risky work first. Each task is a single agent prompt.

## Milestone 1 — The engine is right (ends: correct JSON from a real site)

| ID | Task | Produces | Depends | Files | Done when |
|---|---|---|---|---|---|
| M1-01 | Define the four types | the contract | — | `lib/types.ts` | Evidence, ContentBlock, CheckResult, AuditReport compile and match ARCHITECTURE §3 |
| M1-02 | Guarded fetcher | safe third-party fetch | M1-01 | `lib/fetcher.ts` | Private ranges rejected post-DNS and post-redirect; timeout + 2MB cap enforced |
| M1-03 | robots.txt parser | per-UA resolution | M1-01 | `lib/robots.ts` | Correctly resolves group precedence, wildcards, `Allow` over `Disallow`, for all 12 agents |
| M1-04 | HTML → Evidence | the fact layer | M1-02 | `lib/extract.ts` | Every Evidence field populated from a real page |
| M1-05 | Block segmentation + sub-scores | extractability math | M1-04 | `lib/blocks.ts` | Five sub-scores per block, matching scoring-model.md exactly |
| M1-06 | The check registry | 30+ checks | M1-03..05 | `lib/checks/*` | Every check returns evidence; gates flagged |
| M1-07 | Weights + scoring | five engine scores | M1-06 | `lib/scoring/*` | Weight vectors normalise to 100; gates cap at 25 |
| M1-08 | `/api/audit` | the endpoint | M1-07 | `app/api/audit/route.ts` | Returns a full AuditReport for a live URL in < 8s |

**Risk front-loaded:** M1-05 is the task most likely to force a redesign — it is where the
product's thesis lives. It ships in milestone 1 deliberately.

## Milestone 2 — It is usable (ends: a stranger can audit a site)

| ID | Task | Files | Done when |
|---|---|---|---|
| M2-01 | Design tokens + shell | `app/globals.css`, `app/layout.tsx` | Dark-first palette, type scale, both themes |
| M2-02 | Scan form + state machine | `components/ScanForm.tsx` | idle → scanning → done → error, all rendered |
| M2-03 | Score display | `ScoreDial`, `EngineBars`, `CategoryGrid` | Per-engine spread readable at a glance |
| M2-04 | Findings list | `FindingsList.tsx` | Sorted by severity, evidence expandable, engines labelled |
| M2-05 | Weak-block cards | `BlockCard.tsx` | Quotes the real paragraph with its five sub-scores |
| M2-06 | Export | `lib/export.ts` | Markdown + JSON download, no server round-trip |

## Milestone 3 — The differentiator (ends: audit → rewrite → proven delta)

| ID | Task | Files | Done when |
|---|---|---|---|
| M3-01 | Provider interface | `lib/ai/provider.ts` | Anthropic + OpenAI behind one call, key from env or request |
| M3-02 | Rewrite prompt set | `lib/ai/prompts.ts` | Princeton tactics as positives, invention + stuffing as hard negatives |
| M3-03 | `/api/rewrite` | `app/api/rewrite/route.ts` | Returns rewrite + re-score + real delta + tactics applied |
| M3-04 | Rewrite panel | `RewritePanel.tsx` | Before/after, delta, tactics, copy; disabled state explains itself |
| M3-05 | File generation | `lib/generate/*`, `/api/generate` | Valid llms.txt + JSON-LD from the site's own content, no model needed |

## Milestone 4 — Ship (ends: live and defensible)

| ID | Task | Done when |
|---|---|---|
| M4-01 | Methodology page | Weights, sources and limits published |
| M4-02 | README + own llms.txt | The tool passes its own audit |
| M4-03 | GitHub | Pushed to `Stairexe/crawlspace` |
| M4-04 | Vercel | Production deploy on `rohith-s-projects07`, verified against 3 real sites |

## v2 candidates (not now)
Multi-page crawl · saved reports · competitor comparison · scheduled re-audits · live
citation checks against the five engines.
