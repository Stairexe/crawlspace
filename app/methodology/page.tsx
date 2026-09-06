import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, CATEGORY_BLURBS, CATEGORY_LABELS, ENGINES, ENGINE_LABELS } from "@/lib/types";
import { BASE_WEIGHTS, ENGINE_MULTIPLIERS, ENGINE_RATIONALE, GATE_CAP } from "@/lib/scoring/weights";
import { SUB_WEIGHTS, SUB_LABELS } from "@/lib/blocks";
import { AI_AGENTS } from "@/lib/robots";
import { GEO_TACTICS } from "@/lib/ai/prompts";
import { Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/SocialIcons";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "Every weight Crawlspace uses, where each one came from, and what the tool cannot measure.",
};

function H({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2 id={id} className="scroll-mt-20 pt-10 text-[20px] font-semibold tracking-tight">
      {children}
    </h2>
  );
}

export default function Methodology() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-14">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-signal">methodology</p>
      <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.02em]">
        Every weight, and where it came from
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-dim">
        A score you cannot argue with is a score you cannot trust. This page publishes the whole
        model: the categories, the per-engine multipliers, the block-level rules, and — at the
        end — the things Crawlspace does not measure and does not claim to.
      </p>

      <H id="pipeline">The pipeline</H>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-dim">
        The page is fetched once, as a crawler receives it — server HTML only, no JavaScript
        execution. That fetch produces <em>evidence</em>: facts about the page. Checks read the
        evidence and return a normalised value. Scoring reads the check results and applies five
        different weight vectors. No stage reaches backwards, and no check performs its own
        network request, so the same evidence always produces the same score.
      </p>
      <pre className="mono mt-4 overflow-x-auto rounded-lg border border-line bg-surface p-4 text-[12px] leading-relaxed text-ink-dim">
        {`fetch → evidence → checks → 5 engine scores → findings`}
      </pre>

      <H id="gates">The three gates</H>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-dim">
        Three failures are not deductions. If robots.txt shuts out every agent an engine uses,
        that engine cannot cite the page at all — averaging that into a 70 would be a lie. A
        failed gate caps the affected score at <strong className="text-ink">{GATE_CAP}</strong>{" "}
        and leads the report.
      </p>
      <ul className="mt-4 space-y-2.5">
        {[
          ["Crawler access", "robots.txt disallows every agent that engine uses", "that engine only"],
          ["Reachability", "the page does not return a 2xx", "all five"],
          ["Renders without JavaScript", "under 200 words in the server HTML, with signs of client-side rendering", "all five"],
        ].map(([a, b, c]) => (
          <li key={a} className="card flex flex-col gap-1 p-3.5">
            <span className="text-[13.5px] font-medium">{a}</span>
            <span className="text-[13px] text-ink-faint">Fails when {b}. Caps {c}.</span>
          </li>
        ))}
      </ul>

      <H id="categories">Categories and base weights</H>
      <div className="mt-4 space-y-2">
        {CATEGORIES.map((c) => (
          <div key={c} className="card flex items-start gap-4 p-3.5">
            <span className="mono w-9 shrink-0 text-[18px] font-semibold text-signal">
              {BASE_WEIGHTS[c]}
            </span>
            <span>
              <span className="block text-[13.5px] font-medium">{CATEGORY_LABELS[c]}</span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-faint">
                {CATEGORY_BLURBS[c]}
              </span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-dim">
        Extractability carries 30 — the largest single weight — because an analysis of roughly
        400,000 pages put content-answer fit at about 55% of ChatGPT citation likelihood, against
        12% for domain authority and 14% for on-page structure. Most audit tools weight the
        technical checklist heavily because a regex over robots.txt is cheap to automate and
        judging a paragraph is not. Crawlspace deliberately does the opposite: machine readability
        and retrievability together come to 24.
      </p>

      <H id="engines">Per-engine multipliers</H>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-dim">
        These multiply the base weights and are then renormalised so each engine still sums to
        100. This is the part most tools skip, and it is the reason a page can be an 81 for one
        engine and a 44 for another on identical evidence.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="mono w-full min-w-[560px] border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line text-ink-faint">
              <th className="py-2 pr-3 text-left font-normal">Category</th>
              {ENGINES.map((e) => (
                <th key={e} className="px-2 py-2 text-right font-normal">
                  {ENGINE_LABELS[e].replace("Google ", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((c) => (
              <tr key={c} className="border-b border-line/60">
                <td className="py-2 pr-3 text-ink-dim">{CATEGORY_LABELS[c]}</td>
                {ENGINES.map((e) => {
                  const m = ENGINE_MULTIPLIERS[e][c];
                  return (
                    <td
                      key={e}
                      className="px-2 py-2 text-right"
                      style={{
                        color:
                          m >= 1.3 ? "var(--color-signal)" : m <= 0.85 ? "var(--color-ink-faint)" : "var(--color-ink-dim)",
                      }}
                    >
                      {m.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 space-y-3">
        {ENGINES.map((e) => (
          <div key={e} className="card p-3.5">
            <span className="block text-[13.5px] font-medium">{ENGINE_LABELS[e]}</span>
            <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-faint">
              {ENGINE_RATIONALE[e]}
            </span>
          </div>
        ))}
      </div>

      <H id="blocks">How a passage is scored</H>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-dim">
        Every paragraph, list, table and definition list of twelve words or more is scored on five
        sub-measures. Page extractability is the length-weighted mean, so one good sentence cannot
        carry a page of mush.
      </p>
      <div className="mt-4 space-y-2">
        {(
          [
            ["selfContainment", "Penalises an opening pronoun or back-reference with no antecedent inside the block — “it”, “this”, “as mentioned above”. A passage that only makes sense in place cannot be lifted."],
            ["answerDirectness", "Scores the first sentence for assertion against preamble. “In this article we will look at…” is penalised; “X is Y” is rewarded."],
            ["lengthBand", "Peaks at 40–60 words, with a second band at 130–170 for explanatory passages. Under 15 words is a fragment; past 220 gets truncated mid-argument."],
            ["factualDensity", "Numerals, percentages, currency, dates, named entities and attribution phrases per 100 words."],
            ["readability", "Flesch–Kincaid grade level, targeting 8–12, with a hard penalty above a 30-word mean sentence."],
          ] as const
        ).map(([k, desc]) => (
          <div key={k} className="card flex items-start gap-4 p-3.5">
            <span className="mono w-10 shrink-0 text-[15px] font-semibold text-signal">
              {SUB_WEIGHTS[k].toFixed(2).replace("0.", ".")}
            </span>
            <span>
              <span className="block text-[13.5px] font-medium">{SUB_LABELS[k]}</span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-faint">{desc}</span>
            </span>
          </div>
        ))}
      </div>

      <H id="crawlers">The crawlers checked</H>
      <div className="mt-4 overflow-x-auto">
        <table className="mono w-full min-w-[460px] border-collapse text-[12px]">
          <tbody>
            {AI_AGENTS.map((a) => (
              <tr key={a.agent} className="border-b border-line/60">
                <td className="py-2 pr-4 text-ink">{a.agent}</td>
                <td className="py-2 pr-4 text-ink-faint">{a.role}</td>
                <td className="py-2 text-right text-ink-dim">
                  {a.engine === "training" ? "training only" : ENGINE_LABELS[a.engine]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-dim">
        Blocking CCBot is not penalised. It feeds Common Crawl, which is used for training rather
        than citation, so blocking it costs you nothing in AI answers — it is the one clean way to
        opt out of training while staying quotable.
      </p>

      <H id="rewrite">The rewrite layer</H>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-dim">
        Rewrites are instructed from the Princeton GEO study (KDD 2024), which measured visibility
        lift per tactic against Perplexity. The figures below are that study&apos;s published,
        study-wide results — they are shown as provenance for the instruction set, never as a
        prediction about your page.
      </p>
      <div className="mono mt-4 flex flex-wrap gap-2">
        {GEO_TACTICS.map((t) => (
          <span key={t.id} className="rounded-md border border-line px-2.5 py-1 text-[11.5px] text-ink-dim">
            {t.name} <span className="text-signal">{t.publishedLift}</span>
          </span>
        ))}
        <span className="rounded-md border border-danger/30 px-2.5 py-1 text-[11.5px] text-ink-dim">
          Keyword stuffing <span className="text-danger">−10%</span>
        </span>
      </div>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-dim">
        The rewriter is forbidden from inventing a fact, figure, statistic, date, price, name,
        quote, study or citation that the source passage did not already contain. Keyword
        repetition is a hard negative constraint, not a style note — stuffing measurably reduces
        AI visibility by about 10%, so a naïve &ldquo;SEO rewrite&rdquo; makes things worse. When
        a passage needs evidence the page does not have, the tool says so and leaves that to you.
      </p>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-dim">
        The before/after number on a rewrite is the only lift figure Crawlspace measures: the
        rewritten text is run back through the identical block scorer.
      </p>

      <H id="limits">What this tool does not measure</H>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-dim">
        Naming the gaps is part of the method, not an apology for it.
      </p>
      <ul className="mt-4 space-y-2.5">
        {[
          ["Whether you are actually cited.", "Crawlspace models citability. Confirming citation means querying five engines repeatedly over time — a monitoring product, not an audit."],
          ["Everything off your own domain.", "Brands are cited roughly 6.5x more often through third-party sources than their own site; Wikipedia alone is about 7.8% of ChatGPT citations. A single-domain audit is structurally incomplete, and no amount of on-page work substitutes for presence elsewhere."],
          ["Backlinks and domain authority.", "Real data here requires a paid provider. Crawlspace has no paid dependency, so it does not guess."],
          ["JavaScript-rendered content.", "The page is read as a crawler receives it. That is the point — but it means a client-rendered page scores what a crawler would actually see, not what you see."],
          ["More than one page.", "v1 audits a single URL plus robots.txt, llms.txt and sitemap.xml. Site-wide crawling was deliberately cut rather than half-built."],
        ].map(([a, b]) => (
          <li key={a} className="card p-3.5">
            <span className="block text-[13.5px] font-medium">{a}</span>
            <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-faint">{b}</span>
          </li>
        ))}
      </ul>

      <H id="risk">The assumption that could sink the model</H>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-dim">
        If content-answer fit is not in fact the dominant citation factor, the 30-point
        extractability weight is wrong and the product&apos;s central thesis goes with it. That
        figure rests on one third-party analysis, not a replicated result. Every weight therefore
        lives in a single file, is published on this page, and is stated as a model rather than a
        law — so if the evidence moves, the model moves, and nothing was ever overclaimed.
      </p>

      <H id="sources">Sources</H>
      <ul className="mt-4 space-y-2 text-[13.5px]">
        {[
          ["Google — AI features and your website", "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide"],
          ["Princeton GEO study (KDD 2024)", "https://arxiv.org/abs/2311.09735"],
          ["llmstxt.org — the llms.txt proposal", "https://llmstxt.org"],
          ["State of AI Search 2026 — OrganiKPI", "https://organikpi.com/blog/geo-ai-search/state-of-ai-search/"],
          ["State of llms.txt 2026 — Presenc AI", "https://presenc.ai/research/state-of-llms-txt-2026"],
          ["AI SEO statistics 2026 — Position Digital", "https://www.position.digital/blog/ai-seo-statistics/"],
        ].map(([label, href]) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-ink-dim underline decoration-line-bright underline-offset-4 transition-colors hover:text-signal"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      {/* Author & Research Attribution */}
      <H id="author">Research & Architecture</H>
      <div className="card glass-panel mt-4 p-6 border-line/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="mono text-[11px] uppercase tracking-wider text-signal font-semibold">
              Author & Architect
            </div>
            <h3 className="apple-heading text-[20px] font-bold text-ink mt-0.5">Rohith Reddy</h3>
            <p className="text-[13px] text-ink-dim mt-1">
              AI Marketing & Generative Engine Optimization (GEO) specialist architecting citation models, crawler diagnostics, and LLM visibility heuristics.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-line/60">
          <a
            href="https://github.com/Stairexe"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            className="mono inline-flex items-center gap-2 rounded-xl border border-line bg-surface/70 px-3.5 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-signal/50 hover:text-signal"
          >
            <GitHubIcon className="h-4 w-4" />
            <span>GitHub (Stairexe)</span>
          </a>

          <a
            href="https://linkedin.com/in/rohithreddyasodi"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            className="mono inline-flex items-center gap-2 rounded-xl border border-line bg-surface/70 px-3.5 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-signal/50 hover:text-signal"
          >
            <LinkedInIcon className="h-4 w-4" />
            <span>LinkedIn</span>
          </a>

          <a
            href="mailto:rohithreddyasodi@gmail.com"
            aria-label="Send email"
            className="mono inline-flex items-center gap-2 rounded-xl border border-line bg-surface/70 px-3.5 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-signal/50 hover:text-signal"
          >
            <Mail className="h-4 w-4" />
            <span>rohithreddyasodi@gmail.com</span>
          </a>
        </div>
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <Link href="/" className="mono text-[13px] text-signal hover:brightness-110">
          ← run an audit
        </Link>
      </div>
    </div>
  );
}
