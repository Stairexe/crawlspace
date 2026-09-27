/**
 * crawlspace — the Crawlspace survey engine on the command line and in CI.
 *
 *   npx crawlspace https://example.com/pricing
 *   npx crawlspace https://example.com --min-score 60 --format sarif > crawlspace.sarif
 *
 * Runs the same engine as the website, locally: no API key, no account, and the same
 * SSRF guards. Exit code 1 when a --min-score / --engine-min threshold is not met.
 */
import { gatherEvidence } from "../../lib/extract";
import { runChecks, scoreReport } from "../../lib/scoring/score";
import { compactReport } from "../../lib/summary";
import { ENGINES, ENGINE_LABELS, type AuditReport, type Engine } from "../../lib/types";

const VERSION = "1.0.0";

interface Args {
  url?: string;
  format: "text" | "json" | "sarif" | "markdown";
  minScore?: number;
  engineMin?: number;
  help?: boolean;
}

function parse(argv: string[]): Args {
  const a: Args = { format: "text" };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === "-h" || v === "--help") a.help = true;
    else if (v === "--format" || v === "-f") a.format = argv[++i] as Args["format"];
    else if (v === "--min-score") a.minScore = Number(argv[++i]);
    else if (v === "--engine-min") a.engineMin = Number(argv[++i]);
    else if (v === "--version" || v === "-v") {
      console.log(VERSION);
      process.exit(0);
    } else if (!v.startsWith("-")) a.url = v;
  }
  return a;
}

const HELP = `crawlspace ${VERSION} — survey a page for AI citability

Usage
  crawlspace <url> [--format text|json|markdown|sarif] [--min-score N] [--engine-min N]

Options
  --format       Output format (default: text)
  --min-score    Fail (exit 1) if the composite score is below N
  --engine-min   Fail (exit 1) if any single engine scores below N
  -h, --help     Show this help

Scores model how citable a page is; they do not measure whether it is cited.
Methodology: https://crawlspace-geo.vercel.app/methodology`;

function bar(n: number): string {
  const w = Math.round(n / 5);
  return "█".repeat(w) + "·".repeat(20 - w);
}

function text(r: AuditReport): string {
  const L: string[] = [];
  L.push(`Crawlspace survey — ${r.evidence.finalUrl}`);
  L.push(`Inspected ${r.evidence.fetchedAt}`);
  L.push("");
  for (const e of ENGINES) {
    const s = r.engines[e];
    L.push(`  ${ENGINE_LABELS[e].padEnd(22)} ${String(s.score).padStart(3)}  ${bar(s.score)}${s.capped ? "  GATED — not inspected" : ""}`);
  }
  L.push(`  ${"Composite".padEnd(22)} ${String(r.composite).padStart(3)}`);
  L.push("");
  L.push(r.summary);
  if (r.plan?.steps.length) {
    L.push("");
    L.push(`Fix first (${r.plan.from} → ${r.plan.to}):`);
    r.plan.steps.forEach((s, i) => L.push(`  ${i + 1}. ${s.summary}  [${s.effort}, +${s.gain} → ${s.after}]`));
  }
  L.push("");
  L.push(`Findings (${r.findings.length}):`);
  for (const f of r.findings) L.push(`  [${f.severity.toUpperCase()}] ${f.fix.summary} — ${f.evidence}`);
  return L.join("\n");
}

function markdown(r: AuditReport): string {
  const L = [`## Crawlspace survey — ${r.evidence.finalUrl}`, "", "| Engine | Score |", "|---|---:|"];
  for (const e of ENGINES) L.push(`| ${ENGINE_LABELS[e]} | ${r.engines[e].score}${r.engines[e].capped ? " (gated)" : ""} |`);
  L.push(`| **Composite** | **${r.composite}** |`, "", r.summary, "");
  if (r.plan?.steps.length) {
    L.push(`**Fix first (${r.plan.from} → ${r.plan.to})**`, "");
    r.plan.steps.forEach((s, i) => L.push(`${i + 1}. ${s.summary} — ${s.effort}, +${s.gain}`));
  }
  return L.join("\n");
}

function sarif(r: AuditReport) {
  const level = (s: string) => (s === "critical" || s === "high" ? "error" : s === "medium" ? "warning" : "note");
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "Crawlspace",
            version: VERSION,
            informationUri: "https://crawlspace-geo.vercel.app/methodology",
            rules: r.findings.map((f) => ({
              id: f.checkId,
              name: f.label,
              shortDescription: { text: f.fix.summary },
              fullDescription: { text: f.fix.detail },
              helpUri: "https://crawlspace-geo.vercel.app/methodology",
            })),
          },
        },
        results: r.findings.map((f) => ({
          ruleId: f.checkId,
          level: level(f.severity),
          message: { text: `${f.fix.summary}. Evidence: ${f.evidence}` },
          locations: [{ physicalLocation: { artifactLocation: { uri: r.evidence.finalUrl } } }],
        })),
      },
    ],
  };
}

async function main() {
  const args = parse(process.argv.slice(2));
  if (args.help || !args.url) {
    console.log(HELP);
    process.exit(args.help ? 0 : 2);
  }
  let report: AuditReport;
  try {
    const evidence = await gatherEvidence(args.url!);
    if (evidence.status < 200 || evidence.status >= 300) {
      console.error(`The page answered HTTP ${evidence.status}; there is nothing to score.`);
      process.exit(2);
    }
    report = scoreReport(evidence, runChecks(evidence));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(2);
  }

  if (args.format === "json") console.log(JSON.stringify(compactReport(report), null, 2));
  else if (args.format === "sarif") console.log(JSON.stringify(sarif(report), null, 2));
  else if (args.format === "markdown") console.log(markdown(report));
  else console.log(text(report));

  const failures: string[] = [];
  if (args.minScore !== undefined && report.composite < args.minScore) {
    failures.push(`composite ${report.composite} < ${args.minScore}`);
  }
  if (args.engineMin !== undefined) {
    for (const e of ENGINES as Engine[]) {
      if (report.engines[e].score < args.engineMin) failures.push(`${ENGINE_LABELS[e]} ${report.engines[e].score} < ${args.engineMin}`);
    }
  }
  if (failures.length) {
    console.error(`\ncrawlspace: threshold not met — ${failures.join("; ")}`);
    process.exit(1);
  }
}

void main();
