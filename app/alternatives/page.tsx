import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Crawlspace and the alternatives",
  description:
    "An honest, dated comparison of GEO audit tools and AI visibility trackers — what each does, where each is stronger than Crawlspace, and when to use something else.",
  alternates: { canonical: "/alternatives" },
};

/** When the facts below were read from each tool's own public pages. Update with them. */
const RESEARCHED = "2026-09-27";
const RESEARCHED_LABEL = "27 September 2026";

type Tool = {
  name: string;
  kind: "Audit" | "Developer tool" | "Tracker" | "Brand audit";
  price: string;
  what: string;
  stronger: string;
  url: string;
};

const TOOLS: Tool[] = [
  {
    name: "SEOmator GEO Audit",
    kind: "Audit",
    price: "Free, no signup; an account adds history and alerts",
    what: "One URL to a 0–100 GEO score from six weighted categories, block-level citability, five per-engine readiness scores and 14 AI crawlers, with JSON-LD fixes. A quick scan, or a crawl of up to 50 pages.",
    stronger: "Crawls up to 50 pages against Crawlspace's 20-page sample, and keeps history, alerts, re-audits and share links for signed-in users. It is the closest tool to Crawlspace.",
    url: "https://seomator.com/geo-audit-tool",
  },
  {
    name: "GEO Optimizer",
    kind: "Developer tool",
    price: "Free, MIT-licensed",
    what: "A Python command-line tool and GitHub Action: eight categories scored to 100, 27 AI bots, a minimum-score build gate, SARIF output, sitemap batch audits, and history with regression detection.",
    stronger: "Tracks score history and drift between runs, which Crawlspace's CLI does not yet do, and checks more bot names.",
    url: "https://github.com/marketplace/actions/geo-optimizer-audit",
  },
  {
    name: "ClayHog",
    kind: "Audit",
    price: "Free; monitoring is a paid trial",
    what: "A homepage audit across eight dimensions, including crawler access, llms.txt, schema, server rendering, E-E-A-T, citability, brand presence and per-engine readiness.",
    stronger: "Folds brand presence and platform readiness into one homepage report.",
    url: "https://www.clayhog.com/tools/geo-audit",
  },
  {
    name: "GEO Auditor",
    kind: "Audit",
    price: "Free",
    what: "Fourteen signals in five pillars, with per-engine scores for ChatGPT, Perplexity and Gemini, a sample report and a glossary.",
    stronger: "Scores Gemini, which Crawlspace does not score separately.",
    url: "https://geo-audit-tool.com/",
  },
  {
    name: "Citivra",
    kind: "Brand audit",
    price: "Free",
    what: "Starts from a brand, a category and competitors rather than a URL: it generates buyer-style prompts, reports who gets mentioned and cited, then diagnoses technical causes.",
    stronger: "Measures real mentions and share of voice across prompts — something a page audit, Crawlspace included, cannot do.",
    url: "https://citivra.com/",
  },
  {
    name: "Otterly.AI",
    kind: "Tracker",
    price: "From $29 a month",
    what: "Runs your prompts across several AI engines and reports mentions, share of voice, citations, position and sentiment over time, with an API.",
    stronger: "Monitors actual citations over time. Crawlspace models citability; it does not watch what the engines answer.",
    url: "https://otterly.ai/",
  },
  {
    name: "Peec AI",
    kind: "Tracker",
    price: "From $95 a month",
    what: "Runs each prompt daily and reports visibility, position, sentiment and which sources were used versus cited, with CSV, Looker Studio, an API and an MCP server.",
    stronger: "Daily citation tracking and reporting integrations for marketing teams.",
    url: "https://peec.ai/",
  },
  {
    name: "Profound",
    kind: "Tracker",
    price: "Enterprise; from $99 a month",
    what: "An enterprise AI-visibility platform: prompt volumes, crawler-log analytics, content agents that rewrite decaying pages, and shopping visibility.",
    stronger: "Server-log analytics at scale and managed content work for large sites.",
    url: "https://www.tryprofound.com/",
  },
];

const OURS: [string, string][] = [
  ["Price", "Free. No account, no key for the survey. MIT-licensed and open source."],
  ["Scores", "Five engine scores from one evidence pass, allowed to disagree; a blocked engine is capped at 25, never averaged in."],
  ["Checks", "Thirty-six checks, including passage-level citability, keyword stuffing and a Wikidata lookup of the publisher."],
  ["Crawlers", "Twenty-three AI user agents, with search crawlers kept apart from training crawlers, which never count against a page."],
  ["Fix plan", "Fixes in order of points, each with the exact score after it — re-scored by the model, not estimated."],
  ["Site", "Up to 20 pages sampled from the sitemap across sections, with the defects that repeat site-wide."],
  ["Developers", "HTTP API, an MCP server for Claude and Cursor, a CLI with SARIF output, and a GitHub Action build gate."],
  ["Logs", "A crawler log analyser that reads your access log in the browser; nothing is uploaded."],
  ["Rewrites", "Rewrites weak passages without inventing facts and re-scores the rewrite. Needs your own model API key for now."],
];

const NOT_YET: [string, string][] = [
  ["Citation monitoring", "Crawlspace does not run prompts against the engines or track mentions over time. Use a tracker for that."],
  ["History and alerts", "Surveys are not stored. Export them and use Compare, or use a tool with accounts."],
  ["Large crawls", "The site survey is a 20-page sample, not a full crawl."],
  ["Gemini as its own score", "Google is scored through AI Overviews; Gemini is not scored separately."],
];

export default function AlternativesPage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://crawlspace-geo.vercel.app/alternatives#webpage",
    url: "https://crawlspace-geo.vercel.app/alternatives",
    name: "Crawlspace and the alternatives",
    dateModified: RESEARCHED,
    author: { "@id": "https://crawlspace-geo.vercel.app/#rohith" },
    publisher: { "@id": "https://crawlspace-geo.vercel.app/#organization" },
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="tb-label">Alternatives</div>
      <h1 className="mt-2 text-[clamp(34px,5vw,56px)] leading-[1.02]">Crawlspace and the alternatives.</h1>
      <p className="mono mt-3 text-[11.5px] text-ink-faint">
        Read from each tool&apos;s own public pages on <time dateTime={RESEARCHED}>{RESEARCHED_LABEL}</time> · by{" "}
        <a href="https://github.com/Stairexe" rel="author" className="underline underline-offset-4">
          Rohith Reddy
        </a>
        , who builds Crawlspace
      </p>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-dim">
        A free, per-engine GEO audit is no longer rare, and paid trackers answer a different
        question. This page says what each tool does, where each is stronger than Crawlspace,
        and when you should use something else. Prices and features change; follow the links
        for today&apos;s.
      </p>

      <section aria-labelledby="two-kinds" className="mt-12 grid gap-0 border border-signal md:grid-cols-2">
        <div className="border-b border-line p-5 md:border-b-0 md:border-r">
          <div className="tb-label">Audits</div>
          <h2 id="two-kinds" className="mt-1 text-[20px]">Is this page citable?</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
            Read the page and its site files once, and say what would stop an assistant quoting
            it. Fast, free, fixable today. Crawlspace is one of these.
          </p>
        </div>
        <div className="p-5">
          <div className="tb-label">Trackers</div>
          <h2 className="mt-1 text-[20px]">Is this brand being cited?</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
            Ask the engines the same questions every day and record who they mention. Slower,
            paid, and the only way to see real outcomes. Most teams that care need both.
          </p>
        </div>
      </section>

      <section aria-labelledby="field" className="mt-14">
        <h2 id="field" className="text-[24px]">The field</h2>
        <div className="mt-5 border-t border-signal">
          {TOOLS.map((t) => (
            <article key={t.name} className="grid gap-x-8 gap-y-3 border-b border-line py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div>
                <h3 className="text-[18px] leading-snug">{t.name}</h3>
                <div className="mono mt-1 text-[11px] uppercase tracking-[0.1em] text-ink-faint">{t.kind}</div>
                <div className="mono mt-2 text-[12px] text-ink-dim">{t.price}</div>
              </div>
              <div className="min-w-0 space-y-2.5">
                <p className="text-[14px] leading-relaxed text-ink-dim">{t.what}</p>
                <p className="text-[14px] leading-relaxed text-ink">
                  <span className="tb-label mr-2 inline">Stronger at</span>
                  {t.stronger}
                </p>
                <a href={t.url} target="_blank" rel="noreferrer" className="mono inline-block text-[11.5px] text-ink-faint underline underline-offset-4 hover:text-signal">
                  {t.url.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="ours" className="mt-14 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 id="ours" className="text-[24px]">What Crawlspace does</h2>
          <dl className="mt-5 border-t border-signal">
            {OURS.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[110px_1fr] gap-4 border-b border-line py-3">
                <dt className="tb-label pt-0.5">{k}</dt>
                <dd className="text-[13.5px] leading-relaxed text-ink-dim">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="text-[24px]">What it does not do</h2>
          <dl className="mt-5 border-t border-signal">
            {NOT_YET.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[110px_1fr] gap-4 border-b border-line py-3">
                <dt className="tb-label pt-0.5">{k}</dt>
                <dd className="text-[13.5px] leading-relaxed text-ink-dim">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-[13.5px] leading-relaxed text-ink-dim">
            None of the audit tools above, Crawlspace included, publishes evidence that its
            score predicts real citations. Until one does, treat every GEO score as a model of
            what the engines say they reward.
          </p>
        </div>
      </section>

      <div className="mt-14 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">
          Survey a page
        </Link>
        <Link href="/sample" className="btn-quiet">
          See a sample report
        </Link>
        <Link href="/methodology" className="btn-quiet">
          Methodology
        </Link>
      </div>
    </div>
  );
}
