import { CrawlBot } from "./CrawlBot";

/**
 * Fig. 1 — a web page drawn in section, with the inspector in the crawlspace beneath it.
 *
 * This is an explanatory drawing, and it says so. The callouts are the KINDS of defect
 * Crawlspace raises (each maps to a real check id); none of them is a finding about a
 * real page. Real findings only ever appear on the specimen plate, which is live output.
 */

export const FIG1_KEY = [
  {
    n: 1,
    check: "self-contained-blocks",
    title: "Paragraph opens with “As noted above”",
    body: "Lifted into an answer, the passage points at text the reader never sees. Assistants skip blocks that lean on their neighbours.",
  },
  {
    n: 2,
    check: "answer-length-band",
    title: "212 words in one block",
    body: "Past roughly 220 words an assistant truncates mid-argument. 40–160 words is the band that gets quoted whole.",
  },
  {
    n: 3,
    check: "jsonld-present",
    title: "No structured data in the head",
    body: "Nothing tells an engine what the page is about or who stands behind it, so it has to guess.",
  },
  {
    n: 4,
    check: "crawler-perplexity",
    title: "robots.txt refuses PerplexityBot",
    body: "A gate, not a deduction: that engine cannot read the page, so its score is capped at 25 and marked not inspected.",
  },
] as const;

function Lines({ y0, n, last = 0.62 }: { y0: number; n: number; last?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <line
          key={i}
          className="ln"
          pathLength={1}
          x1={176}
          x2={i === n - 1 ? 176 + 348 * last : 524}
          y1={y0 + i * 10}
          y2={y0 + i * 10}
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.55}
        />
      ))}
    </>
  );
}

function Dim({ y1, y2, label }: { y1: number; y2: number; label: string }) {
  const mid = (y1 + y2) / 2;
  return (
    <g>
      <line className="ln" pathLength={1} x1={566} x2={566} y1={y1} y2={y2} stroke="currentColor" strokeWidth={1} />
      <line className="ln" pathLength={1} x1={561} x2={571} y1={y1} y2={y1} stroke="currentColor" strokeWidth={1} />
      <line className="ln" pathLength={1} x1={561} x2={571} y1={y2} y2={y2} stroke="currentColor" strokeWidth={1} />
      <text x={578} y={mid + 3.5} className="fig-label" fill="currentColor">
        {label}
      </text>
    </g>
  );
}

function Callout({ n, cx, cy, to }: { n: number; cx: number; cy: number; to: [number, number] }) {
  return (
    <g className="text-danger">
      <line className="ln" pathLength={1} x1={cx} y1={cy} x2={to[0]} y2={to[1]} stroke="currentColor" strokeWidth={1.2} />
      <g className="callout-pin" style={{ ["--i" as string]: n }}>
        <circle cx={to[0]} cy={to[1]} r={2.6} fill="currentColor" />
        <circle cx={cx} cy={cy} r={11} fill="var(--color-surface)" stroke="currentColor" strokeWidth={1.5} />
        <text x={cx} y={cy + 3.6} textAnchor="middle" className="fig-callout" fill="currentColor">
          {n}
        </text>
      </g>
    </g>
  );
}

export function FigSurvey() {
  return (
    <svg
      data-draw
      viewBox="0 0 720 420"
      className="block h-auto w-full text-signal"
      role="img"
      aria-labelledby="fig1-title fig1-desc"
    >
      <title id="fig1-title">Fig. 1 — a web page drawn in section</title>
      <desc id="fig1-desc">
        A page is drawn as a building section above a floor line, with the crawl-bot
        inspecting it from the crawlspace below. Four numbered callouts mark example defects:
        a paragraph that depends on earlier text, a 212-word block, a missing structured
        data block, and a robots.txt rule that blocks one AI crawler.
      </desc>
      <defs>
        <pattern id="fig1-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-signal)" strokeWidth="1" opacity="0.18" />
        </pattern>
      </defs>

      {/* The crawlspace: hatched void beneath the floor */}
      <rect x={20} y={310} width={680} height={88} fill="url(#fig1-hatch)" />
      <line className="ln" pathLength={1} x1={20} x2={700} y1={398} y2={398} stroke="currentColor" strokeWidth={1} />
      <text x={690} y={388} textAnchor="end" className="fig-label" fill="currentColor">
        CRAWLSPACE
      </text>

      {/* The page, in section */}
      <rect className="ln" pathLength={1} x={150} y={24} width={400} height={286} fill="var(--color-surface)" stroke="currentColor" strokeWidth={1.5} />
      <rect x={150.75} y={24.75} width={398.5} height={26} fill="var(--color-wash)" />
      <line className="ln" pathLength={1} x1={150} x2={550} y1={51} y2={51} stroke="currentColor" strokeWidth={1} />
      <text x={162} y={41.5} className="fig-label" fill="currentColor">
        &lt;head&gt;
      </text>
      <rect x={176} y={66} width={236} height={13} rx={1.5} fill="currentColor" opacity={0.9} />
      <Lines y0={98} n={3} last={0.4} />
      <Lines y0={136} n={7} last={0.7} />

      {/* A table, drawn as a grid */}
      <rect className="ln" pathLength={1} x={176} y={216} width={348} height={54} fill="none" stroke="currentColor" strokeWidth={1} />
      {[234, 252].map((y) => (
        <line key={y} className="ln" pathLength={1} x1={176} x2={524} y1={y} y2={y} stroke="currentColor" strokeWidth={0.8} />
      ))}
      {[263, 350, 437].map((x) => (
        <line key={x} className="ln" pathLength={1} x1={x} x2={x} y1={216} y2={270} stroke="currentColor" strokeWidth={0.8} />
      ))}
      <Lines y0={288} n={1} last={0.3} />

      {/* Measured: words per block */}
      <Dim y1={93} y2={123} label="46 w" />
      <Dim y1={131} y2={201} label="212 w" />
      <Dim y1={283} y2={293} label="9 w" />

      {/* Floor line: the HTML as served */}
      <line className="ln" pathLength={1} x1={20} x2={700} y1={310} y2={310} stroke="currentColor" strokeWidth={2.2} />
      <text x={24} y={302} className="fig-label" fill="currentColor">
        FLOOR LINE — HTML AS SERVED
      </text>

      {/* Sight lines from the torch up through the floor */}
      {[
        [300, 290],
        [420, 250],
        [520, 150],
      ].map(([x, y]) => (
        <line key={x} x1={117} y1={362} x2={x} y2={y} stroke="currentColor" strokeWidth={0.8} strokeDasharray="3 4" opacity={0.5} />
      ))}

      {/* The inspector */}
      <g transform="translate(62 318)">
        <CrawlBot detail="full" size={110} lensLit />
      </g>

      <Callout n={1} cx={112} cy={98} to={[172, 98]} />
      <Callout n={2} cx={660} cy={166} to={[612, 166]} />
      <Callout n={3} cx={112} cy={37} to={[150, 37]} />
      <Callout n={4} cx={660} cy={338} to={[604, 310]} />
    </svg>
  );
}
