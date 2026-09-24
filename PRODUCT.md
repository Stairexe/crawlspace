# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: GEO/SEO practitioners and technically-literate site owners.** People who
already believe AI search matters and want evidence they can act on or show a client.
They audit more than one site, return repeatedly, and will argue with the methodology —
which is the point. (Audience chosen by Claude on 2026-09-19 after Rohith delegated the
decision. Rationale: they are the only audience with a recurring reason to create an
account, the product's real edge — per-engine divergence and published weights — is only
legible to them, and their respect is what converts into work and referrals.)

**Secondary: developers who own the site they are auditing.** They act on robots.txt,
schema and SSR findings themselves and want copy-pasteable output.

**Evaluating audience, not a user: hiring managers and recruiters in AI search.** They
never run a real audit; they judge whether the builder understands the domain. They are
served by the same craft and honesty the primary audience needs, not by separate content.

## Product Purpose

Crawlspace measures how usable a web page is to AI assistants that answer questions by
quoting passages, and shows the operator exactly which passages fail and why. Success is
an operator who leaves knowing three specific things to change, with the evidence for
each, and who trusts the number enough to repeat the audit after changing them.

## Positioning

Two claims a neighbouring product could not truthfully copy today:

1. **Five separate engine scores from one evidence pass.** Google states AI-specific
   files and chunked content are not required for AI Overviews, while ChatGPT, Claude and
   Perplexity reward them. Crawlspace applies five weight vectors to identical evidence,
   so the divergence stays visible instead of averaged into one number.
2. **The closed loop.** It names the failing passage, rewrites it, and re-scores the
   rewrite with the identical scorer. The before/after delta is measured, not projected.

## Operating Context

Used in a browser, usually with the audited site open in another tab. Sessions are short
and goal-directed: paste URL, read verdict, act. Output travels — into a client email, a
Jira ticket, a PR description — so exports and copyable fixes matter more than time spent
on the site. Practitioners audit several pages in a sitting and compare across them.

## Capabilities and Constraints

**Real today:** single-URL audit; robots.txt resolution against 12 named AI user agents;
six scored categories; five per-engine scores with published multipliers; block-level
extractability scoring on five sub-measures; prioritised findings carrying literal
evidence; deterministic generation of llms.txt, JSON-LD and a robots.txt allow-group;
Markdown and JSON export; SSRF-guarded server-side fetch; per-IP rate limiting.

**Built but never exercised:** the LLM rewrite endpoint. No API key has ever been
configured, so the path has not run end to end. It must not be described as proven.

**Shells over localStorage, no backend:** /dashboard, /history, /reports, /settings,
/login, /signup. No Firebase, Supabase, Prisma or any database exists.

**Deliberately absent:** multi-page crawling, backlink and domain-authority data, live
citation monitoring, billing.

**The load-bearing unknown:** the scoring model has never been validated against ground
truth. Nobody has checked whether pages scoring 80 are cited more often than pages
scoring 40. Weights derive from published GEO research, not from testing this tool's own
output. Everything the product says about itself must stay inside that limit.

**Terminology:** engine (the five answer engines), evidence (facts from one fetch), check
(a pass/warn/fail with literal evidence), gate (a failure that caps a score at 25 rather
than deducting), block (a scored passage), finding (a prioritised fix), spread (the gap
between highest and lowest engine score).

## Brand Commitments

Name: **Crawlspace**. Retained by Claude's judgment after Rohith granted licence to change
anything — the double reading (the crawler, and the neglected space under a house that
nobody inspects) is exactly the product's subject, and it is not worth spending.

Business model, confirmed 2026-09-19: free tool with accounts; no charging yet; no
pricing page; monetisation deferred until there is evidence anyone returns.

Voice: plain, specific, unhedged. States limits in its own voice rather than burying them.
Never "command center", "intelligence layer", or any noun phrase inflating what a check does.

## Evidence on Hand

- Working engine, verified live 2026-09-24: Wikipedia GEO article 69, stripe.com 64,
  stripe.com/docs/payments 42, Vercel docs 71, the Crawlspace landing page itself 56.
- Published methodology page carrying every weight, multiplier and stated limit.
- Groundwork corpus in-repo: research/SUMMARY.md, research/scoring-model.md,
  research/competitors.md, docs/PRD.md, docs/ARCHITECTURE.md, DECISIONS.md.
- Princeton GEO study (KDD 2024) measured lift per tactic; Google's AI-features guidance.

**Absences future work must not fabricate:** no users, no traffic, no testimonials, no
case studies, no citation-rate improvements attributable to the tool, no validation of the
scoring model. `lib/mockReport.ts` currently fabricates audit data about Stripe, including
invented passage quotes; it is to be deleted, not restyled.

## Product Principles

1. **Only report what was measured.** Every number traces to a check; every check quotes
   the literal string it found. Published study figures are labelled as such.
2. **Divergence is the product.** Never collapse the five engines into one headline number.
3. **A gate is not a deduction.** An engine that cannot reach the page cannot cite it, and
   the report says so before anything else.
4. **The tool must pass its own audit.** Server-rendered content, schema matching visible
   copy, no JS gate on the content layer.
5. **Useful with zero credentials.** Everything except the rewrite runs without an API key.

## Accessibility & Inclusion

WCAG 2.1 AA. Score must never be carried by colour alone — every score states its band in
text. Motion respects prefers-reduced-motion, including the intro sequence. Keyboard path
through the audit flow without a pointer.
