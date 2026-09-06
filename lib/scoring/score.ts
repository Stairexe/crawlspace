import type {
  AuditReport,
  Category,
  CheckResult,
  Engine,
  EngineScore,
  Evidence,
  Finding,
  Severity,
  VisibilityScores,
} from "../types";
import { CATEGORIES, ENGINES, ENGINE_LABELS } from "../types";
import { BASE_WEIGHTS, GATE_CAP, weightsFor } from "./weights";
import { crawlerChecks } from "../checks/crawlers";
import { contentChecks } from "../checks/content";
import { technicalChecks } from "../checks/technical";

export const REPORT_VERSION = "1.0.0";

export function runChecks(e: Evidence): CheckResult[] {
  return [...crawlerChecks(e), ...contentChecks(e), ...technicalChecks(e)];
}

/** Weighted mean of the scoring checks in one category, 0..100. */
function categoryScore(checks: CheckResult[], category: Category): number {
  const relevant = checks.filter((c) => c.category === category && c.weight > 0 && c.status !== "na");
  if (relevant.length === 0) return 0;
  const totalWeight = relevant.reduce((n, c) => n + c.weight, 0);
  const earned = relevant.reduce((n, c) => n + c.value * c.weight, 0);
  return Math.round((earned / totalWeight) * 1000) / 10;
}

/**
 * Severity is the number of composite points this single check is actually costing,
 * scaled by how many engines it hurts. Not a vibe: it is
 *   category weight × this check's share of its category × points missed × engine fraction.
 */
function severityFor(check: CheckResult, checks: CheckResult[], enginesAffected: number): Severity {
  if (check.gate) return "critical";
  const categoryTotal = checks
    .filter((c) => c.category === check.category && c.weight > 0 && c.status !== "na")
    .reduce((n, c) => n + c.weight, 0);
  if (categoryTotal === 0) return "low";
  const share = check.weight / categoryTotal;
  const missed = 1 - check.value;
  const impact = BASE_WEIGHTS[check.category] * share * missed * (enginesAffected / ENGINES.length);
  if (impact >= 5) return "critical";
  if (impact >= 2.5) return "high";
  if (impact >= 1) return "medium";
  return "low";
}

function listJoin(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

export function calculateVisibilityScores(
  e: Evidence,
  checks: CheckResult[],
  compositeGeo: number,
): VisibilityScores {
  // 1. SEO Score (0..100)
  let seo = 0;
  if (e.html.title && e.html.title.length >= 10 && e.html.title.length <= 70) seo += 15;
  else if (e.html.title) seo += 8;
  if (e.html.metaDescription && e.html.metaDescription.length >= 40 && e.html.metaDescription.length <= 165) seo += 15;
  else if (e.html.metaDescription) seo += 8;
  if (e.semantics.h1Count === 1) seo += 15;
  else if (e.semantics.h1Count > 1) seo += 7;
  if (e.html.canonical) seo += 10;
  if (e.openGraph?.title && (e.openGraph?.image || e.openGraph?.description)) seo += 10;
  else if (e.openGraph?.title) seo += 5;
  if (e.twitter?.card) seo += 5;
  const noindex = /noindex/i.test(e.robots.metaRobots ?? "") || /noindex/i.test(e.robots.xRobotsTag ?? "");
  if (!noindex) seo += 15;
  if (e.semantics.hierarchyOk) seo += 10;
  if (e.media.images === 0 || e.media.withAlt / Math.max(1, e.media.images) >= 0.7) seo += 5;

  // 2. Crawler Score (0..100)
  const searchAgents = ["Googlebot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Bingbot"];
  let allowedCount = 0;
  for (const agent of searchAgents) {
    const rule = e.robots.rules[agent];
    if (!rule || rule.allowed) allowedCount++;
  }
  const crawlers = Math.round((allowedCount / searchAgents.length) * 100);

  // 3. Technical Score (0..100)
  let technical = 0;
  if (e.status >= 200 && e.status < 300) technical += 25;
  if (e.url.startsWith("https://")) technical += 15;
  if (e.timings.fetchMs < 800) technical += 20;
  else if (e.timings.fetchMs < 1800) technical += 14;
  else technical += 8;
  if (e.renderedWithoutJs) technical += 20;
  if (e.html.htmlBytes < 250_000) technical += 10;
  else if (e.html.htmlBytes < 800_000) technical += 6;
  if (e.html.viewport) technical += 10;

  // 4. Content Score (0..100)
  let content = 0;
  if (e.html.textWords >= 600) content += 25;
  else if (e.html.textWords >= 300) content += 18;
  else if (e.html.textWords >= 150) content += 10;
  else content += 4;
  if (e.signals.questionHeadings >= 2) content += 20;
  else if (e.signals.questionHeadings >= 1) content += 12;
  const factualTotal = e.signals.stats + e.signals.percentages + e.signals.years;
  if (factualTotal >= 10) content += 20;
  else if (factualTotal >= 4) content += 14;
  else content += 6;
  if (e.links.externalCitations >= 2) content += 15;
  else if (e.links.external >= 2) content += 8;
  if (e.blocks.length >= 4) content += 20;
  else if (e.blocks.length >= 2) content += 10;

  // 5. Schema Score (0..100)
  let schema = 0;
  if (e.jsonLd.length > 0) schema += 35;
  const types = e.schemaAnalysis?.detectedTypes ?? [];
  if (types.some((t) => /Organization|Corporation|Brand/i.test(t))) schema += 25;
  if (types.some((t) => /WebPage|Article|BlogPosting/i.test(t))) schema += 20;
  if (types.some((t) => /FAQPage|BreadcrumbList|Product|Service/i.test(t))) schema += 20;
  if (e.schemaAnalysis?.issues.length) {
    schema = Math.max(0, schema - Math.min(25, e.schemaAnalysis.issues.length * 6));
  }

  // 6. Overall Blended Visibility Score (0..100)
  const overall = Math.round(
    seo * 0.22 +
      compositeGeo * 0.22 +
      crawlers * 0.16 +
      technical * 0.15 +
      content * 0.13 +
      schema * 0.12,
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    seo: Math.min(100, Math.max(0, seo)),
    geo: Math.min(100, Math.max(0, compositeGeo)),
    crawlers: Math.min(100, Math.max(0, crawlers)),
    technical: Math.min(100, Math.max(0, technical)),
    content: Math.min(100, Math.max(0, content)),
    schema: Math.min(100, Math.max(0, schema)),
  };
}

export function scoreReport(evidence: Evidence, checks: CheckResult[]): AuditReport {
  const categories = Object.fromEntries(
    CATEGORIES.map((c) => [c, categoryScore(checks, c)]),
  ) as Record<Category, number>;

  // Which engines are gated out, and why.
  const gateReasons = new Map<Engine, string>();
  for (const check of checks) {
    if (!check.gate || check.status === "pass" || check.status === "na") continue;
    const affected = check.gate === "all" ? ENGINES : check.gate;
    for (const engine of affected) {
      if (!gateReasons.has(engine)) gateReasons.set(engine, check.label + " — " + check.evidence);
    }
  }

  const engines = Object.fromEntries(
    ENGINES.map((engine): [Engine, EngineScore] => {
      const w = weightsFor(engine);
      const raw = CATEGORIES.reduce((n, c) => n + (categories[c] * w[c]) / 100, 0);
      const capped = gateReasons.has(engine);
      const score = capped ? Math.min(GATE_CAP, Math.round(raw)) : Math.round(raw);
      return [
        engine,
        {
          score,
          capped,
          capReason: gateReasons.get(engine),
          categories: w,
        },
      ];
    }),
  ) as Record<Engine, EngineScore>;

  const scores = ENGINES.map((e) => engines[e].score);
  const composite = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const spread = Math.max(...scores) - Math.min(...scores);
  const visibility = calculateVisibilityScores(evidence, checks, composite);

  const findings: Finding[] = checks
    .filter((c) => (c.status === "fail" || c.status === "warn") && c.fix)
    .map((c) => {
      const affected = c.gate === "all" ? ENGINES : c.gate ?? c.engines ?? ENGINES;
      return {
        checkId: c.id,
        label: c.label,
        category: c.category,
        severity: severityFor(c, checks, affected.length),
        effort: c.fix!.effort,
        engines: affected,
        evidence: c.evidence,
        fix: c.fix!,
        status: c.status,
      };
    })
    .sort((a, b) => {
      const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity];
      const effortOrder = { trivial: 0, small: 1, medium: 2, large: 3 } as const;
      return effortOrder[a.effort] - effortOrder[b.effort];
    });

  const sortedBlocks = [...evidence.blocks].sort((a, b) => a.scores.total - b.scores.total);
  const weakestBlocks = sortedBlocks.filter((b) => b.scores.total < 0.75).slice(0, 6);
  const strongestBlock =
    [...evidence.blocks].sort((a, b) => b.scores.total - a.scores.total)[0] ?? null;

  return {
    version: REPORT_VERSION,
    evidence,
    checks,
    engines,
    visibility,
    composite,
    spread,
    findings,
    weakestBlocks,
    strongestBlock,
    summary: buildSummary(evidence, engines, composite, spread, findings),
  };
}

function buildSummary(
  e: Evidence,
  engines: Record<Engine, EngineScore>,
  composite: number,
  spread: number,
  findings: Finding[],
): string {
  const gated = ENGINES.filter((x) => engines[x].capped);
  if (gated.length) {
    const names = listJoin(gated.map((g) => ENGINE_LABELS[g]));
    const plural = gated.length > 1;
    return `${names} cannot use this page at all — which caps ${plural ? "those scores" : "that score"} at ${GATE_CAP} however good the content is. Fix the access problem first; nothing else in this report matters until you do.`;
  }

  const best = [...ENGINES].sort((a, b) => engines[b].score - engines[a].score)[0];
  const worst = [...ENGINES].sort((a, b) => engines[a].score - engines[b].score)[0];
  const critical = findings.filter((f) => f.severity === "critical").length;
  const quickWins = findings.filter((f) => f.effort === "trivial" || f.effort === "small").length;

  const band =
    composite >= 80
      ? "in good shape"
      : composite >= 60
        ? "workable but leaving citations on the table"
        : composite >= 40
          ? "hard for an assistant to use"
          : "effectively invisible to AI answers";

  const spreadNote =
    spread >= 15
      ? ` The ${spread}-point gap between ${ENGINE_LABELS[best]} and ${ENGINE_LABELS[worst]} is the interesting part: this page is tuned for one kind of engine and not the other.`
      : " The five engines agree closely on this page, so the fixes below help everywhere at once.";

  return `${e.html.textWords.toLocaleString("en-US")} words across ${e.blocks.length} content blocks — ${band} at ${composite}/100 composite.${spreadNote}${critical ? ` ${critical} critical issue${critical > 1 ? "s" : ""} to clear first.` : ""}${quickWins ? ` ${quickWins} of the ${findings.length} findings are trivial or small fixes.` : ""}`;
}
