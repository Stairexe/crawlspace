import Link from "next/link";
import { FAQ } from "@/lib/faq";
import { FigSurvey, FIG1_KEY } from "./FigSurvey";
import { FocusSurveyButton } from "./FocusSurveyButton";

/**
 * Everything below the hero. Server-rendered: none of this needs JavaScript, and all of
 * it is the copy a crawler should read. Reveals are progressive (see RevealObserver).
 */

type Style = React.CSSProperties & { ["--i"]?: number };
const i = (n: number): Style => ({ ["--i"]: n });

const GOOGLE_AI_FEATURES_URL = "https://developers.google.com/search/docs/appearance/ai-features";

function SectionHead({ mark, title, lede, id }: { mark: string; title: React.ReactNode; lede?: React.ReactNode; id?: string }) {
  return (
    <header id={id} className="grid scroll-mt-20 gap-4 border-t border-signal pt-5 md:grid-cols-12">
      <div className="mono text-[11px] uppercase tracking-[0.14em] text-signal md:col-span-3">{mark}</div>
      <div className="md:col-span-9">
        <h2 data-reveal className="text-[clamp(30px,4.4vw,54px)] leading-[1.02]">
          {title}
        </h2>
        {lede && (
          <p data-reveal style={i(1)} className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-dim">
            {lede}
          </p>
        )}
      </div>
    </header>
  );
}

const STAGES = [
  {
    n: "01",
    name: "Access",
    q: "Can the engine get in?",
    body: "Access is checked before anything else: robots.txt for each engine’s own crawler, then the response, noindex, and whether the content exists without JavaScript. An engine that cannot get in is marked not inspected and capped at 25, and that failure is never averaged into a passing score.",
  },
  {
    n: "02",
    name: "Measure",
    q: "What is each passage worth on its own?",
    body: "Every block on the page is measured on its own: its length band, whether it names its own subject, whether the answer comes first, question-shaped headings, tables, figures, sources and attributed quotes.",
  },
  {
    n: "03",
    name: "Score",
    q: "Five schedules, one evidence pass.",
    body: "Scoring is one evidence pass through five weight vectors, one per engine, all published on the methodology page. The engines disagree about what matters, so the scores are allowed to disagree too.",
  },
  {
    n: "04",
    name: "Repair",
    q: "Rewrite what cannot be lifted.",
    body: "The rewriter is optional and needs an API key. It drafts new versions of the weakest passages and is forbidden from adding statistics, citations, quotes or claims the page does not already make. Structured data and llms.txt drafts come from what the page states.",
  },
];

const SCHEDULES: { name: string; note: string; items: { label: string; gate?: boolean }[] }[] = [
  {
    name: "Access",
    note: "9 checks",
    items: [
      { label: "Crawler access, per engine (×5)", gate: true },
      { label: "Page responds", gate: true },
      { label: "Content renders without JavaScript", gate: true },
      { label: "Page is indexable" },
      { label: "Training-only crawler (CCBot)" },
    ],
  },
  {
    name: "Passages",
    note: "11 checks",
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
    ],
  },
  {
    name: "Structure & signals",
    note: "14 checks",
    items: [
      { label: "Structured data (JSON-LD)" },
      { label: "Organisation entity defined" },
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

export function LandingSections({ specimen }: { specimen: React.ReactNode }) {
  return (
    <div className="space-y-28 sm:space-y-36">
      {/* §1 — the drawing */}
      <section aria-labelledby="method-h">
        <SectionHead
          id="method"
          mark="§ 01 — Method"
          title={<span id="method-h">A page, drawn in section.</span>}
          lede="A survey is one fetch of the page, made the way a crawler makes it: no browser, no JavaScript. What comes back is the building. Anything an assistant quotes has to be in that HTML, so that is what gets measured."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <figure className="plate p-3 sm:p-5 lg:col-span-8">
            <FigSurvey />
            <figcaption className="mono mt-3 border-t border-line pt-3 text-[10.5px] leading-relaxed text-ink-faint">
              Fig. 1 — Illustrative. The callouts are the kinds of defect a survey raises, keyed to
              real check ids. Real findings appear only on Plate 2, which is live output.
            </figcaption>
          </figure>

          <ol className="space-y-5 lg:col-span-4">
            {FIG1_KEY.map((k, n) => (
              <li key={k.n} data-reveal style={i(n)} className="grid grid-cols-[28px_1fr] gap-3">
                <span className="callout" data-n={k.n} aria-hidden />
                <div>
                  <div className="text-[14.5px] font-semibold leading-snug text-ink">{k.title}</div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-dim">{k.body}</p>
                  <code className="mono mt-1.5 block text-[10.5px] text-ink-faint">{k.check}</code>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* §2 — the stages */}
      <section aria-labelledby="stages-h">
        <SectionHead
          mark="§ 02 — Procedure"
          title={<span id="stages-h">Four stages, in order.</span>}
          lede="Access is always surveyed first, because there is no point grading passages an engine was never allowed to read."
        />
        <ol className="mt-10 border-t border-line">
          {STAGES.map((s, n) => (
            <li
              key={s.n}
              data-reveal
              style={i(n)}
              className="grid gap-2 border-b border-line py-6 md:grid-cols-12 md:gap-6"
            >
              <div className="flex items-baseline gap-3 md:col-span-3">
                <span className="num text-[13px] text-signal" data-n={s.n} aria-hidden />
                <span className="plate-title text-[22px] leading-none">{s.name}</span>
              </div>
              <div className="text-[15.5px] font-semibold text-ink md:col-span-3">{s.q}</div>
              <p className="max-w-xl text-[14.5px] leading-relaxed text-ink-dim md:col-span-6">{s.body}</p>
            </li>
          ))}
        </ol>

        <figure data-reveal className="mt-12 grid gap-4 md:grid-cols-12">
          <div className="tb-label md:col-span-3 md:pt-2">Why the scores differ</div>
          <div className="md:col-span-9">
            <blockquote cite={GOOGLE_AI_FEATURES_URL} className="plate-title max-w-3xl text-[clamp(21px,2.4vw,30px)] leading-[1.2] text-ink">
              “You don’t need to create new machine readable files, AI text files, or markup to appear
              in these features.”
            </blockquote>
            <figcaption className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-dim">
              That is Google, in{" "}
              <a href={GOOGLE_AI_FEATURES_URL} className="underline underline-offset-4" rel="noopener">
                AI features and your website
              </a>{" "}
              on Search Central. The other engines make no such statement, and the GEO research this
              model is built on finds that structure and markup help them. One score cannot be right
              for both, so Crawlspace issues five.
            </figcaption>
          </div>
        </figure>
      </section>

      {/* §3 — the specimen */}
      <section aria-labelledby="specimen-h">
        <SectionHead
          id="specimen"
          mark="§ 03 — Specimen"
          title={<span id="specimen-h">Plate 2: a real survey.</span>}
          lede="This plate is Stripe’s payments documentation, surveyed by this engine when the page was last built. Every figure is whatever the engine returned, including the unflattering ones."
        />
        <div className="mt-10">{specimen}</div>
      </section>

      {/* §4 — the schedule of checks */}
      <section aria-labelledby="schedule-h">
        <SectionHead
          id="schedule"
          mark="§ 04 — Schedule"
          title={<span id="schedule-h">What is inspected.</span>}
          lede="The survey is thirty-four checks in three schedules. Each has a permanent id, a stated weight per engine, and a line of literal evidence in the report."
        />
        <div className="mt-10 grid border-l border-t border-line md:grid-cols-3">
          {SCHEDULES.map((s, n) => (
            <div key={s.name} data-reveal style={i(n)} className="border-b border-r border-line bg-surface/60 p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[18px]">{s.name}</h3>
                <span className="tb-label">{s.note}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {s.items.map((it) => (
                  <li key={it.label} className="flex items-baseline gap-2.5 text-[13.5px] text-ink-dim">
                    {it.gate ? (
                      <span
                        className="mono inline-flex h-4 w-4 shrink-0 translate-y-[2px] items-center justify-center rounded-[2px] bg-signal text-[8.5px] font-semibold text-void"
                        data-n="G"
                        aria-hidden
                      />
                    ) : (
                      <span className="inline-block h-px w-4 shrink-0 -translate-y-[4px] bg-line-bright" aria-hidden />
                    )}
                    <span>
                      {it.label}
                      {it.gate && <span className="sr-only"> (gate)</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mono mt-4 flex items-center gap-2.5 text-[11px] text-ink-faint">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-[2px] bg-signal text-[8.5px] font-semibold text-void" data-n="G" aria-hidden />
          A gate is a check whose failure caps the engines it affects at 25 and marks them not inspected.
        </p>
      </section>

      {/* §5 — questions */}
      <section aria-labelledby="faq-h">
        <SectionHead id="faq" mark="§ 05 — Questions" title={<span id="faq-h">Questions.</span>} />
        <div className="mt-8 border-t border-line md:ml-[25%]">
          {FAQ.map((f, n) => (
            <details key={f.q} className="faq group border-b border-line" open={n === 0}>
              <summary className="flex cursor-pointer list-none items-baseline gap-4 py-5 text-left">
                <span className="num w-7 shrink-0 text-[12px] text-ink-faint" data-n={String(n + 1).padStart(2, "0")} aria-hidden />
                <h3 className="flex-1 text-[16.5px] font-semibold leading-snug text-ink" style={{ fontVariationSettings: '"wdth" 100' }}>
                  {f.q}
                </h3>
                <span aria-hidden className="faq-mark mono text-[16px] text-signal" data-n="+" />
              </summary>
              <div className="max-w-2xl pb-6 pl-11">
                <p className="text-[14.5px] leading-relaxed text-ink-dim">{f.a}</p>
                {f.source && (
                  <p className="mono mt-3 text-[11px] leading-relaxed text-ink-faint">
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
      </section>

      {/* End of sheet */}
      <section className="border-y-[3px] border-double border-signal py-14 text-center sm:py-20">
        <div className="tb-label">End of sheet</div>
        <h2 data-reveal className="mx-auto mt-4 max-w-3xl text-[clamp(34px,5.6vw,72px)] leading-[1]">
          Survey a page.
        </h2>
        <p data-reveal style={i(1)} className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-ink-dim">
          A survey needs one URL and nothing else: no account, no key. The report exports as Markdown or JSON.
        </p>
        <div data-reveal style={i(2)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <FocusSurveyButton />
          <Link href="/methodology" className="btn-quiet">
            Read the methodology
          </Link>
        </div>
      </section>
    </div>
  );
}
