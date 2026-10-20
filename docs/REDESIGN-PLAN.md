# Redesign + accounts plan (v1.1)

Owner request: make Crawlspace look and feel like firecrawl.dev, add accounts and storage,
use GSAP and three.js, fix what is broken, ship to `main` (Vercel auto-deploys it).

## Findings from the live site (before)

Audits run end to end on production in under a second and the gates fire correctly
(a JavaScript-only page is capped at 25 for every engine). Problems found:

1. **Gate leak in the headline number.** The dashboard's "Website Visibility Score" blends
   SEO, crawler and technical sub-scores with the GEO composite. A page no engine can read
   (excalidraw.com: every engine gated, GEO 13) showed **53**. That breaks the rule
   "never average a failed gate into a passing score".
2. **Contradictory tiles.** "AI Crawlers 100 · 0/5 not gated" on the same page: the score is
   robots.txt only, the caption counted every gate.
3. **Two latency numbers.** "Page fetch 19ms" and "Server response 761ms" on one screen.
4. **Filler panel.** "Live Audit View" repeats the URL and status and nothing else.
5. **No persistence.** Sign in / sign up are placeholders; History, Saved reports and
   Settings tabs all say "arrives with accounts".

## Design system (firecrawl.dev)

- Ground `#F9F9F9`, white cells, hairlines `#E8E8E8`, ink `#262626`, body `#616161`-ish.
- One accent: orange `#FF4C00`, used for the second line of headlines, primary buttons,
  bracket counters and live data. Never for decoration-only fills.
- Geist (sans) + Geist Mono. Headings weight 500, tight tracking.
- Layout: a centred 1112px column bounded by vertical hairlines, sections separated by
  full-width rules with `+` crosshair marks at intersections, mono bracket labels
  `[ 01 / 06 ] MAIN FEATURES`.
- Motion: GSAP timeline for the hero, ScrollTrigger reveals, number counters; three.js
  point-cloud globe behind the hero; ASCII dot fields (2D canvas) behind section heads.
  Everything pauses off-screen and is static under `prefers-reduced-motion`.

Token names (`void`, `surface`, `ink`, `signal`…) are kept so every existing page re-skins
from `app/globals.css` alone.

## Accounts + storage

- Email + password. scrypt hashes, HMAC-signed httpOnly session cookie (`AUTH_SECRET`).
- Storage adapter: Vercel Blob (private store) when `BLOB_READ_WRITE_TOKEN` is set,
  a local `.data/` directory in development, and *off* in production without a store
  (account routes answer 503 and the UI says so — no silent data loss).
- Signed-in audits are saved server-side by `/api/audit` (best effort; an audit never
  fails because saving failed). History, saved reports, share links and account settings
  read from storage.
- Guests: the last 20 audits are kept in this browser (localStorage) so History works
  without an account.
- The audit itself still needs no account and no key.

## Order of work

1. Types → storage → auth → API routes.
2. Score fixes (gate cap on the headline number, crawler caption, one latency number).
3. Design tokens, navbar, footer, landing (hero with three.js + GSAP, sections), auth pages.
4. Dashboard: history / reports / settings / account wired to storage; share links.
5. Docs (CLAUDE.md, DECISIONS D8, ARCHITECTURE-ESSENTIALS), build, typecheck, browser
   screenshots desktop + mobile, push to `main`.
