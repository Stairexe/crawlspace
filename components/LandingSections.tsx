import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  FileSearch,
  FileCode2,
  Wand2,
  ShieldCheck,
  Gauge,
  ListChecks,
  Bot,
  Terminal,
  GitBranch,
  Quote,
} from "lucide-react";
import { FAQ } from "@/lib/faq";
import { ENGINES, ENGINE_LABELS } from "@/lib/types";
import type { Specimen } from "@/lib/demo";
import { LiveSpecimen } from "./LiveSpecimen";
import { AsciiField } from "./AsciiField";
import { CodeTabs } from "./CodeTabs";

/**
 * Everything below the hero. Server-rendered copy a crawler can read; the motion
 * ([data-reveal], [data-split], [data-bar], [data-count]) is layered on by Motion.tsx.
 */

const BASE = "https://crawlspace-geo.vercel.app";
const TOTAL = "06";
const GOOGLE_AI_FEATURES_URL = "https://developers.google.com/search/docs/appearance/ai-features";

function Bracket({ n, label }: { n: string; label: string }) {
  return (
    <div className="rule-x">
      <div className="frame cross flex items-center gap-4 px-0">
        <span className="h-10 w-[3px] bg-signal" aria-hidden />
        <span className="bracket py-3">
          [ <b>{n}</b> / {TOTAL} ] <span className="ml-3">{label}</span>
        </span>
      </div>
    </div>
  );
}

function SectionHead({
  n,
  label,
  eyebrow,
  icon,
  title,
  accent,
  after,
  lede,
  id,
  shape = "wave",
}: {
  n: string;
  label: string;
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
  accent: string;
  after?: string;
  lede: string;
  id?: string;
  shape?: "wave" | "orb" | "flame" | "terrain";
}) {
  return (
    <>
      <Bracket n={n} label={label} />
      <div id={id} className="rule-x scroll-mt-20">
        <div className="frame relative overflow-hidden px-5 py-20 text-center sm:py-24">
          <AsciiField shape={shape} className="absolute inset-0 h-full w-full opacity-60" />
          <div className="relative">
            <span data-reveal className="eyebrow">
              <span className="inline-flex items-center gap-1.5">
                {icon}
                {eyebrow}
              </span>
            </span>
            <h2 data-split className="mx-auto mt-5 max-w-3xl text-[clamp(32px,5vw,54px)] leading-[1.06]">
              <span className="reveal-line">
                <span>
                  {title} <span className="text-signal">{accent}</span>
                  {after ? ` ${after}` : ""}
                </span>
              </span>
            </h2>
            <p data-reveal className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed text-ink-dim">
              {lede}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/** The preview under the hero: a page on the left, what the engine returned on the right. */
function Preview({ specimen }: { specimen: Specimen }) {
  const r = specimen.report;
  let host = "stripe.com/docs/payments";
  if (r) {
    try {
      const u = new URL(r.evidence.finalUrl);
      host = u.host + u.pathname.replace(/\/$/, "");
    } catch {
      /* keep default */
    }
  }
  const json = r
    ? JSON.stringify(
        {
          url: r.evidence.finalUrl,
          composite: r.composite,
          engines: Object.fromEntries(ENGINES.map((e) => [e, r.engines[e].score])),
          gated: ENGINES.filter((e) => r.engines[e].capped),
          findings: r.findings.length,
          fix_first: r.plan?.steps[0]?.summary ?? null,
        },
        null,
        2,
      )
    : null;

  return (
    <div className="rule-x">
      <div className="frame px-4 py-12 sm:px-10">
        <div data-reveal className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_60px_-30px_rgba(0,0,0,0.18)]">
          <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
            <span className="dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span className="mono flex-1 truncate rounded-lg bg-void px-3 py-1 text-[12px] text-ink-faint">
              crawlspace.audit/<span className="text-ink">{host}</span>
            </span>
            <span className="mono hidden rounded-md bg-wash px-2 py-0.5 text-[11px] text-signal sm:inline">
              {r ? `${r.evidence.status} · ${r.evidence.timings.fetchMs}ms` : "live"}
            </span>
          </div>
          <div className="grid md:grid-cols-[1.1fr_1fr]">
            <div className="border-b border-line p-6 md:border-b-0 md:border-r">
              <div className="flex items-baseline justify-between">
                <span className="bracket">[ per-engine scores ]</span>
                {r && <span className="mono text-[12px] text-ink-faint">{r.spread}-pt spread</span>}
              </div>
              <ul className="mt-5 space-y-4">
                {ENGINES.map((e) => {
                  const s = r?.engines[e];
                  return (
                    <li key={e}>
                      <div className="flex items-baseline justify-between text-[13.5px]">
                        <span className="text-ink-dim">{ENGINE_LABELS[e]}</span>
                        <span className="num text-ink" data-count={s ? s.score : undefined}>
                          {s ? s.score : "—"}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-raised">
                        <div
                          data-bar={s ? s.score / 100 : 0}
                          className={`h-full origin-left rounded-full ${s?.capped ? "bg-danger" : "bg-signal"}`}
                          style={{ transform: `scaleX(${s ? s.score / 100 : 0})` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              {!r && <p className="mt-5 text-[13px] text-ink-faint">{specimen.reason} Run an audit above to see live output.</p>}
            </div>
            <div className="bg-void/50">
              <div className="flex items-center justify-between border-b border-line px-4 py-2">
                <span className="mono text-[11px] text-ink-faint">POST /api/audit</span>
                <span className="mono text-[11px] text-ink-faint">[ .json ]</span>
              </div>
              <pre tabIndex={0} className="code thin-scroll overflow-x-auto p-5 text-[12.5px]">
                {(json ?? '{\n  "url": "…",\n  "composite": …,\n  "engines": { … },\n  "findings": …\n}').split("\n").map((line, i) => {
                  const m = line.match(/^(\s*)("[^"]+")(:\s*)(.*)$/);
                  return (
                    <div key={i} className="flex gap-4">
                      <span className="w-4 shrink-0 select-none text-right text-ink-faint/50">{i + 1}</span>
                      {m ? (
                        <span className="min-w-0">
                          {m[1]}
                          <span className="k">{m[2]}</span>
                          {m[3]}
                          <span className={/^"/.test(m[4]) ? "s" : "n"}>{m[4]}</span>
                        </span>
                      ) : (
                        <span>{line}</span>
                      )}
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        </div>
        <p className="mono mt-3 text-center text-[11.5px] text-ink-faint">
          Live output from the engine for {host}, refreshed at most once a day. Not a mockup.
        </p>
      </div>
    </div>
  );
}

function EngineStrip() {
  return (
    <div className="rule-x">
      <div className="frame grid grid-cols-2 md:grid-cols-6">
        <div className="col-span-2 flex items-center border-b border-line px-6 py-6 text-[15px] leading-snug text-ink md:col-span-1 md:border-b-0 md:border-r">
          <span>
            Scored separately for <span className="text-signal">five engines</span>
          </span>
        </div>
        {ENGINES.map((e, i) => (
          <div
            key={e}
            data-reveal
            className={`flex items-center justify-center border-line px-4 py-6 text-center text-[15px] font-medium tracking-tight text-ink-dim ${
              i % 2 === 0 ? "border-r" : ""
            } ${i < 4 ? "border-b md:border-b-0" : ""} md:border-r md:last:border-r-0`}
          >
            {ENGINE_LABELS[e]}
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: <FileSearch className="h-5 w-5" />,
    title: "Audit",
    body: "Fetch a page like a crawler, check 23 AI agents in robots.txt, and score five engines apart.",
    href: "/#top",
    cta: "Run an audit",
  },
  {
    icon: <Wand2 className="h-5 w-5" />,
    title: "Rewrite",
    body: "Redraft the passages an assistant cannot lift, without inventing a single fact.",
    href: "/methodology#rewrite",
    cta: "How rewriting works",
    tag: "Key",
  },
  {
    icon: <FileCode2 className="h-5 w-5" />,
    title: "Generate",
    body: "llms.txt, Organization and FAQPage JSON-LD and a robots.txt, drafted from what the page says.",
    href: "/tools",
    cta: "Free tools",
  },
];

const STAGES = [
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    name: "Access",
    q: "Can the engine get in?",
    body: "robots.txt for each engine’s own crawler, the response, noindex, and whether content exists without JavaScript. An engine that cannot get in is capped at 25, never averaged into a pass.",
  },
  {
    icon: <ListChecks className="h-4 w-4" />,
    name: "Measure",
    q: "What is each passage worth on its own?",
    body: "Every block is measured alone: length band, whether it names its subject, whether the answer comes first, question headings, tables, figures, sources and quotes.",
  },
  {
    icon: <Gauge className="h-4 w-4" />,
    name: "Score",
    q: "Five weightings, one evidence pass.",
    body: "One pass through five published weight vectors, one per engine. The engines disagree about what matters, so their scores are allowed to disagree too.",
  },
  {
    icon: <Wand2 className="h-4 w-4" />,
    name: "Repair",
    q: "Rewrite what cannot be lifted.",
    body: "Optional and key-gated. Drafts the weakest passages again and is forbidden from adding statistics, citations, quotes or claims the page does not already make.",
  },
];

const SCHEDULES: { name: string; note: string; items: { label: string; gate?: boolean }[] }[] = [
  {
    name: "Access",
    note: "9 checks",
    items: [
      { label: "Search-crawler access, per engine (×5)", gate: true },
      { label: "Page responds", gate: true },
      { label: "Content renders without JavaScript", gate: true },
      { label: "Page is indexable" },
      { label: "Training-only crawler (CCBot)" },
    ],
  },
  {
    name: "Passages",
    note: "12 checks",
    items: [
      { label: "Blocks survive being lifted out of the page" },
      { label: "Paragraphs name their own subject" },
      { label: "Answers stated before the build-up" },
      { label: "Blocks sit in a quotable length band" },
      { label: "Headings phrased the way people ask" },
      { label: "FAQ section present" },
      { label: "Tables and lists where they belong" },
      { label: "Clean heading hierarchy" },
      { label: "Specific figures in the copy" },
      { label: "Sources cited and linked" },
      { label: "Attributed quotes" },
      { label: "No keyword stuffing" },
    ],
  },
  {
    name: "Structure & signals",
    note: "15 checks",
    items: [
      { label: "Structured data (JSON-LD)" },
      { label: "Organisation entity defined" },
      { label: "Known entity in Wikidata / Wikipedia" },
      { label: "Named author" },
      { label: "Freshness signal" },
      { label: "llms.txt" },
      { label: "Sitemap" },
      { label: "Semantic HTML landmarks" },
      { label: "Title tag" },
      { label: "Meta description" },
      { label: "Canonical URL" },
      { label: "Language declared" },
      { label: "Image alt text" },
      { label: "Internal linking" },
      { label: "Content-to-markup ratio" },
    ],
  },
];

export function LandingSections({ specimen }: { specimen: Specimen }) {
  const r = specimen.report;
  const output = r
    ? JSON.stringify(
        {
          composite: r.composite,
          engines: Object.fromEntries(ENGINES.map((e) => [e, r.engines[e].score])),
          top_findings: r.findings.slice(0, 3).map((f) => f.checkId),
        },
        null,
        2,
      )
    : '{\n  "composite": …,\n  "engines": { … },\n  "top_findings": [ … ]\n}';

  return (
    <div>
      <Preview specimen={specimen} />
      <EngineStrip />

      {/* 01 — Features */}
      <SectionHead
        n="01"
        label="Main features"
        eyebrow="Built for GEO"
        icon={<span className="h-2 w-2 rounded-[2px] bg-signal" />}
        title="Start auditing"
        accent="in seconds"
        lede="The layer between your content and the assistants that quote it: find what they cannot read, then fix it."
        shape="wave"
      />
      <div className="rule-x">
        <div className="frame grid md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              data-reveal
              className={`group flex flex-col items-center px-8 py-12 text-center transition-colors hover:bg-surface ${
                i < 2 ? "border-b border-line md:border-b-0 md:border-r" : ""
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-signal shadow-sm">
                {f.icon}
              </span>
              <h3 className="mt-5 flex items-center gap-2 text-[17px]">
                {f.title}
                {f.tag && <span className="mono rounded-md bg-wash px-1.5 py-0.5 text-[10px] uppercase text-signal">{f.tag}</span>}
              </h3>
              <p className="mt-2 max-w-[260px] text-[14px] leading-relaxed text-ink-dim">{f.body}</p>
              <Link href={f.href} className="link-accent mt-5 text-[14px]">
                {f.cta} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
      <div className="rule-x">
        <div className="frame px-4 py-10 sm:px-10" data-reveal>
          <CodeTabs
            tabs={[
              {
                id: "curl",
                label: "cURL",
                icon: <span className="mono text-[11px]">{"{ }"}</span>,
                code: `# One page, full report\ncurl -X POST ${BASE}/api/audit \\\n  -H 'content-type: application/json' \\\n  -d '{"url":"https://example.com/pricing"}'`,
              },
              {
                id: "node",
                label: "Node.js",
                icon: <span className="mono text-[11px]">JS</span>,
                code: `// No SDK, no key — plain fetch\nconst res = await fetch("${BASE}/api/audit", {\n  method: "POST",\n  headers: { "content-type": "application/json" },\n  body: JSON.stringify({ url: "https://example.com/pricing" }),\n});\nconst report = await res.json();\nconsole.log(report.composite, report.engines);`,
              },
              {
                id: "python",
                label: "Python",
                icon: <span className="mono text-[11px]">PY</span>,
                code: `# pip install requests\nimport requests\n\nreport = requests.post(\n    "${BASE}/api/audit",\n    json={"url": "https://example.com/pricing"},\n).json()\nprint(report["composite"], report["engines"])`,
              },
              {
                id: "mcp",
                label: "MCP",
                icon: <Bot className="h-3.5 w-3.5" />,
                code: `# Claude Code\nclaude mcp add --transport http crawlspace \\\n  ${BASE}/api/mcp\n\n# Then ask your agent:\n# "Audit example.com/pricing for AI citability"`,
              },
            ]}
            output={output}
          />
        </div>
      </div>

      {/* 02 — Specimen */}
      <SectionHead
        id="specimen"
        n="02"
        label="Specimen"
        eyebrow="Live output"
        icon={<span className="h-2 w-2 rounded-full bg-good" />}
        title="A real audit,"
        accent="not a mockup"
        lede="Stripe’s payments documentation, audited by this engine when the page was last built. Every figure is what the engine returned, including the unflattering ones."
        shape="orb"
      />
      <div className="rule-x">
        <div className="frame px-4 py-12 sm:px-10" data-reveal>
          <LiveSpecimen specimen={specimen} />
        </div>
      </div>

      {/* 03 — Method */}
      <SectionHead
        id="method"
        n="03"
        label="How it works"
        eyebrow="Zero configuration"
        icon={<span className="inline-flex h-3 w-5 items-center rounded-full bg-signal p-[2px]"><span className="ml-auto h-2 w-2 rounded-full bg-white" /></span>}
        title="We read it"
        accent="like a crawler"
        lede="One fetch, made the way a crawler makes it: no browser, no JavaScript. Anything an assistant quotes has to be in that HTML, so that is what gets measured."
        shape="terrain"
      />
      <div className="rule-x">
        <div className="frame grid md:grid-cols-2">
          {STAGES.map((s, i) => (
            <div
              key={s.name}
              data-reveal
              className={`px-8 py-10 ${i % 2 === 0 ? "md:border-r" : ""} ${i < 2 ? "border-b" : i === 2 ? "border-b md:border-b-0" : ""} border-line`}
            >
              <div className="flex items-center gap-2 text-[13px] text-ink-faint">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-signal">{s.icon}</span>
                <span className="mono">0{i + 1}</span> {s.name}
              </div>
              <p className="mt-4 text-[20px] leading-snug tracking-tight text-ink">
                <span className="font-medium">{s.q}</span>{" "}
                <span className="text-ink-faint">{s.body}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="rule-x">
        <div className="frame grid md:grid-cols-[1fr_2fr]">
          <div className="flex items-center gap-2 border-b border-line px-8 py-8 text-[13px] text-ink-faint md:border-b-0 md:border-r">
            <Quote className="h-4 w-4 text-signal" /> Why the scores differ
          </div>
          <div className="px-8 py-10" data-reveal>
            <p className="text-[clamp(20px,2.4vw,26px)] leading-snug tracking-tight text-ink">
              “You don’t need to create new machine readable files, AI text files, or markup to appear in these features.”
            </p>
            <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-ink-dim">
              That is Google, in{" "}
              <a href={GOOGLE_AI_FEATURES_URL} className="text-ink underline underline-offset-4" rel="noopener">
                AI features and your website
              </a>
              . The other engines make no such statement, and the GEO research this model is built on finds that
              structure and markup help them. One score cannot be right for both, so Crawlspace issues five.
            </p>
          </div>
        </div>
      </div>

      {/* 04 — What is inspected */}
      <SectionHead
        n="04"
        label="Checks"
        eyebrow="36 checks"
        icon={<ListChecks className="h-3.5 w-3.5 text-signal" />}
        title="Every check comes with"
        accent="evidence"
        lede="Each has a permanent id, a stated weight per engine, and a line of literal evidence you can verify on your own page."
        shape="wave"
      />
      <div className="rule-x">
        <div className="frame grid md:grid-cols-3">
          {SCHEDULES.map((col, i) => (
            <div key={col.name} data-reveal className={`${i < 2 ? "border-b border-line md:border-b-0 md:border-r" : ""}`}>
              <div className="flex items-baseline justify-between border-b border-line px-6 py-4">
                <h3 className="text-[16px]">{col.name}</h3>
                <span className="mono text-[11px] uppercase text-ink-faint">{col.note}</span>
              </div>
              <ul className="px-6 py-4">
                {col.items.map((it) => (
                  <li key={it.label} className="flex items-start gap-2.5 py-1.5 text-[14px] text-ink-dim">
                    {it.gate ? (
                      <span className="mono mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded bg-signal text-[9px] font-semibold text-white" title="Gate">
                        G
                      </span>
                    ) : (
                      <span className="mt-[9px] h-px w-3 shrink-0 bg-line-bright" />
                    )}
                    {it.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="rule-x">
        <p className="frame px-6 py-3 text-[12.5px] text-ink-faint">
          <span className="mono mr-2 rounded bg-signal px-1 text-[9px] font-semibold text-white">G</span>
          A gate is a check whose failure caps the engines it affects at 25 and marks them not inspected.
        </p>
      </div>

      {/* 05 — Agents */}
      <SectionHead
        n="05"
        label="Power your agent"
        eyebrow="Agent ready"
        icon={<Bot className="h-3.5 w-3.5 text-signal" />}
        title="Plug it into"
        accent="your AI agents"
        lede="The same engine as the website, from an MCP server, a CLI or a GitHub Action. None of them needs an API key."
        shape="orb"
      />
      <div className="rule-x">
        <div className="frame grid md:grid-cols-2">
          <div data-reveal className="border-b border-line p-8 md:border-b-0 md:border-r">
            <p className="text-[18px] leading-snug tracking-tight">
              <span className="font-medium text-ink">One command.</span>{" "}
              <span className="text-ink-faint">Give Claude, Cursor or any MCP client an audit_url tool.</span>
            </p>
            <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <span className="flex gap-1 text-[12px]">
                  <span className="rounded-md bg-void px-2 py-0.5 text-ink shadow-[inset_0_0_0_1px_var(--color-line)]">MCP</span>
                </span>
                <Terminal className="h-3.5 w-3.5 text-ink-faint" />
              </div>
              <pre tabIndex={0} className="code thin-scroll overflow-x-auto p-4 text-[12.5px]">{`claude mcp add --transport http crawlspace \\\n  ${BASE}/api/mcp`}</pre>
            </div>
            <Link href="/developers#mcp" className="link-accent mt-5 text-[14px]">
              View the docs <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div data-reveal className="p-8">
            <p className="text-[18px] leading-snug tracking-tight">
              <span className="font-medium text-ink">Guard your deploys.</span>{" "}
              <span className="text-ink-faint">Fail the build when a page drops below a score.</span>
            </p>
            <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <span className="rounded-md bg-void px-2 py-0.5 text-[12px] text-ink shadow-[inset_0_0_0_1px_var(--color-line)]">
                  .github/workflows
                </span>
                <GitBranch className="h-3.5 w-3.5 text-ink-faint" />
              </div>
              <pre tabIndex={0} className="code thin-scroll overflow-x-auto p-4 text-[12.5px]">{`- uses: Stairexe/crawlspace@main\n  with:\n    url: https://example.com/pricing\n    min-score: 60`}</pre>
            </div>
            <Link href="/developers#action" className="link-accent mt-5 text-[14px]">
              Set up the Action <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rule-x mt-16">
        <div className="frame cross relative grid md:grid-cols-[1fr_2fr_1fr]">
          <div className="relative hidden h-full min-h-[300px] border-r border-line md:block">
            <span className="mono absolute left-4 top-4 text-[11px] text-ink-faint/70">[ ROBOTS ]</span>
            <span className="mono absolute bottom-4 left-4 text-[11px] text-ink-faint/70">[ SCHEMA ]</span>
            <AsciiField shape="flame" accent className="absolute inset-x-0 bottom-0 h-[85%] w-full" />
          </div>
          <div className="grid-cells relative px-6 py-20 text-center">
            <span data-reveal className="eyebrow">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] bg-signal" /> Get started
              </span>
            </span>
            <h2 data-split className="mt-5 text-[clamp(32px,4.4vw,48px)]">
              <span className="reveal-line">
                <span>Ready to audit?</span>
              </span>
            </h2>
            <p data-reveal className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-ink-dim">
              Audits are free and need no account. Create one to keep your history and share reports.{" "}
              <span className="text-ink">No credit card, ever.</span>
            </p>
            <div data-reveal className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/#top" className="btn-primary">
                Start free audit
              </Link>
              <Link href="/signup" className="btn-quiet">
                Create account
              </Link>
            </div>
          </div>
          <div className="relative hidden h-full min-h-[300px] border-l border-line md:block">
            <span className="mono absolute right-4 top-4 text-[11px] text-ink-faint/70">[ LLMS.TXT ]</span>
            <span className="mono absolute bottom-4 right-4 text-[11px] text-ink-faint/70">[ CRAWL ]</span>
            <AsciiField shape="flame" accent className="absolute inset-x-0 bottom-0 h-[85%] w-full" />
          </div>
        </div>
      </div>

      {/* 06 — FAQ */}
      <div className="mt-16">
        <Bracket n="06" label="FAQ" />
      </div>
      <div id="faq" className="rule-x scroll-mt-20">
        <div className="frame grid md:grid-cols-2">
          <div className="relative overflow-hidden border-b border-line px-8 py-16 md:border-b-0 md:border-r">
            <AsciiField shape="orb" className="absolute inset-0 h-full w-full opacity-50" />
            <div className="relative">
              <h2 data-split className="text-[clamp(32px,4vw,46px)] leading-[1.05]">
                <span className="reveal-line">
                  <span>Frequently</span>
                </span>
                <span className="reveal-line">
                  <span>
                    asked <span className="text-signal">questions</span>
                  </span>
                </span>
              </h2>
              <p data-reveal className="mt-4 text-[15px] text-ink-dim">
                Everything you need to know about GEO and how Crawlspace measures it.
              </p>
            </div>
          </div>
          <div>
            {FAQ.map((f, n) => (
              <details key={f.q} className="faq group border-b border-line last:border-b-0" open={n === 0}>
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-8 py-5 text-[15.5px] font-medium text-ink hover:bg-surface">
                  {f.q}
                  <ChevronDown aria-hidden className="faq-mark h-4 w-4 shrink-0 text-ink-faint" />
                </summary>
                <div className="px-8 pb-6 text-[14.5px] leading-relaxed text-ink-dim">
                  <p>{f.a}</p>
                  {f.source && (
                    <p className="mono mt-3 text-[11.5px] text-ink-faint">
                      Source:{" "}
                      <a href={f.source.url} className="underline underline-offset-4 hover:text-ink" rel="noopener">
                        {f.source.label}
                      </a>
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
