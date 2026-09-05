# Decisions — Crawlspace

Phase 5 interrogation. What was attacked, what changed, why.

---

## D1 — Cut: multi-page crawling (over-engineered for v1)

**Draft said:** crawl up to 25 pages, aggregate a site score.
**Attack:** a crawl needs a queue, concurrency control, a politeness delay, and somewhere to
put partial results — which means storage, which means a retention decision, which means a
privacy policy. That is the whole v1 budget spent on the least differentiated feature, and
the incumbents already do it better.
**Decision:** v1 audits **one URL** plus the three root files. Deferred to v2 with its own
justification. `[CUT]`

---

## D2 — Cut: shareable report URLs

**Draft said:** every audit gets a permanent shareable link.
**Attack:** same problem — storage, retention, and now the tool is hosting snapshots of
third-party sites it does not own. Legal surface for zero v1 value.
**Decision:** Markdown/JSON export instead. The user owns the artefact. `[CUT]`

---

## D3 — Pinned down: what "self-contained" actually means

**Draft said:** "score whether the paragraph is self-contained." Under-specified — an agent
would have invented something arbitrary and the number would have meant nothing.
**Decision:** specified as a concrete rule in `research/scoring-model.md` §Extractability:
penalise block-initial deixis with no in-block antecedent (`it`, `this`, `that`, `these`,
`those`, `such`, `the former/latter`, `as mentioned/described/discussed above`, `here`,
`he/she/they` with no prior named entity), scaled by how early it appears. Deterministic,
testable, explainable to a user. `[SPECIFIED]`

---

## D4 — Contradiction resolved: PRD promised a single score, research said don't

PRD §3 originally led with "a 0–100 GEO score." Research finding #2 says a blended number
misrepresents Google, whose own guidance is that AI files and chunking are not required.
**Decision:** per-engine is the primary output; the composite is shown small and secondary,
and the methodology page states plainly why. PRD F3 rewritten. `[RESOLVED]`

---

## D5 — The assumption that would invalidate everything

**If content-answer fit is not actually the dominant citation factor, the 30% extractability
weight is wrong and the product's whole thesis is wrong.** That figure rests on one
third-party analysis, not a replicated result.

**Mitigation, not a fix:** weights live in one file (`lib/scoring/weights.ts`), the
methodology page publishes them, and the tool says which finding each weight came from. If
the evidence moves, one file changes and the claim was never overstated. Recorded as the
project's headline risk. `[RISK ACCEPTED]`

---

## D6 — Rewrite layer must not be load-bearing

**Attack:** if the public deployment has no API key, does the tool look broken?
**Decision:** made a hard requirement in PRD §5. Deterministic mode is the default and is
fully useful; the rewrite panel explains itself while disabled and accepts a user's own key.
The demo must never depend on the owner's API budget surviving strangers' traffic. `[SPECIFIED]`

---

## D7 — SSRF was missing from the first draft entirely

The audit route fetches an arbitrary user-supplied URL server-side. The first architecture
draft did not mention it. Added as `ARCHITECTURE.md` §5 with post-DNS and post-redirect
private-range validation. This is the single most likely way this project embarrasses its
author in a code review. `[ADDED]`
