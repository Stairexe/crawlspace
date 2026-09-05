# Money — Crawlspace

Honest version: **v1 makes ₹0 and is not supposed to make money.** Its return is a job.
This file exists so that if it *does* turn into a product, the arithmetic was done in advance.

## What it is actually for

The primary return is a credential. The target is a paid, remote, ~2–3h/day internship in
AI search / GEO / AI-led marketing. In that market the differentiator is not "knows what GEO
is" — everyone writing a cover letter says that. It is a live URL that runs a defensible
scoring model against any site the interviewer types in.

**Value of the return:** a paid GEO/AI-marketing internship in the Indian remote market
runs roughly ₹8,000–₹25,000/month for a part-time student role, higher for overseas remote
contract work paid in USD. One offer repays the build many times over. That is the only
number in this file that matters right now.

## Cost to build and run

| Item | Cost |
|---|---|
| Hosting (Vercel Hobby) | ₹0 |
| Domain | ₹0 on `*.vercel.app`; ~₹900/yr if a custom domain is wanted later |
| Deterministic audits | ₹0 — no third-party API is called |
| Rewrite layer | ₹0 in default deployment (users bring their own key); ~₹0.4–1.5 per rewrite if the owner's key is used |
| Build time | one weekend |

**Unit economics of the free tier: exactly zero marginal cost per audit.** That is a design
outcome, not an accident — it is why the deterministic engine has no paid dependency, and it
is what makes leaving the tool public indefinitely safe.

## If it were monetised

Three models, in order of how well they fit a solo student operator:

1. **Service wedge (most realistic).** The tool is free and generates the diagnosis; the
   paid thing is the fix. Audit → "here are 14 findings" → "₹6,000–₹15,000 to implement
   them." This fits the existing freelance motion and needs no billing infrastructure.
   Time to first rupee: fastest, because the tool itself is the lead magnet.
2. **Freemium SaaS.** Free single-page audit; paid multi-page crawl, saved history, scheduled
   re-audits, competitor comparison. Comparable tools sit at roughly $19–$99/mo. Requires
   everything D1 and D2 deliberately cut — accounts, storage, billing. Not before there is
   demand evidence.
3. **Nothing.** Leave it free forever as a portfolio artefact. Costs ₹0/month. Entirely valid.

## Scenarios (12 months)

| | Assumption | Outcome |
|---|---|---|
| **Conservative** | Tool is used in applications; no monetisation attempted | ₹0 revenue; strengthened portfolio; the résumé line is true |
| **Realistic** | Lands the paid internship it was built for | ₹96,000–₹300,000/yr from employment, not from the product |
| **Good** | Internship **plus** 3–5 audit-to-implementation freelance jobs at ₹8,000 avg | above, plus ~₹24,000–₹40,000 in service revenue |

Assumptions stated so they can be checked later: that a live tool materially improves
interview conversion (unproven, but cheap to test); that GEO implementation work is
sellable to the small businesses already in the outreach pipeline (partially evidenced by
prior freelance conversations, not yet by a closed sale).

## Kill criteria

- If, **by 30 November 2026**, the tool has been sent with ≥20 applications and produced
  **zero** interview conversations that mention it — stop investing build time in it. Keep
  it live as a portfolio piece and move the effort to outreach instead.
- If Vercel free-tier limits are ever exceeded by strangers' traffic — rate-limit harder
  rather than paying. This project does not earn a hosting bill.
