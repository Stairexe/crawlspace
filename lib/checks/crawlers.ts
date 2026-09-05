import type { CheckResult, Engine, Evidence } from "../types";
import { AI_AGENTS, blockedEngines } from "../robots";

/**
 * Gate checks. A failed gate hard-caps the affected engines at 25 — see
 * research/scoring-model.md §The gate. Block the bot, lose the citation.
 */
export function crawlerChecks(e: Evidence): CheckResult[] {
  const checks: CheckResult[] = [];
  const blocked = blockedEngines(e.robots.rules);

  // One gate check per engine, so a report can say exactly which engine is shut out.
  const byEngine = new Map<Engine, string[]>();
  for (const spec of AI_AGENTS) {
    if (spec.engine === "training") continue;
    const rule = e.robots.rules[spec.agent];
    if (rule && !rule.allowed) {
      byEngine.set(spec.engine, [...(byEngine.get(spec.engine) ?? []), `${spec.agent} (${rule.matchedLine ?? "blocked"})`]);
    }
  }

  for (const engine of ["chatgpt", "perplexity", "claude", "google-aio", "copilot"] as Engine[]) {
    const isBlocked = blocked.includes(engine);
    const partial = byEngine.get(engine);
    checks.push({
      id: `crawler-${engine}`,
      category: "machine-readability",
      label: `Crawler access — ${engine}`,
      status: isBlocked ? "fail" : partial ? "warn" : "pass",
      value: isBlocked ? 0 : partial ? 0.5 : 1,
      weight: 0,
      gate: isBlocked ? [engine] : undefined,
      engines: [engine],
      evidence: isBlocked
        ? `robots.txt blocks every agent this engine uses: ${partial?.join(", ")}`
        : partial
          ? `Partly blocked — ${partial.join(", ")}. Other agents for this engine still have access.`
          : e.robots.found
            ? "All agents for this engine are allowed by robots.txt."
            : "No robots.txt found, so nothing is blocked.",
      fix: isBlocked || partial
        ? {
            summary: "Unblock the AI crawlers you want citations from",
            detail:
              "Blocking the crawler is not a partial penalty — that engine literally cannot cite a page it cannot fetch. " +
              "Add an allow group in robots.txt for the agents above. If the concern is model training rather than citation, " +
              "block CCBot (Common Crawl) instead: it is training-only and blocking it costs you no citations.",
            effort: "trivial",
          }
        : undefined,
    });
  }

  // Reachability — gates everything.
  const reachable = e.status >= 200 && e.status < 300;
  checks.push({
    id: "page-reachable",
    category: "retrievability",
    label: "Page responds",
    status: reachable ? "pass" : "fail",
    value: reachable ? 1 : 0,
    weight: 0,
    gate: reachable ? undefined : "all",
    evidence: `HTTP ${e.status} from ${e.finalUrl}`,
    fix: reachable
      ? undefined
      : {
          summary: "Return a 200 for this URL",
          detail: `The page answered with HTTP ${e.status}. Nothing can be cited from a page that does not load.`,
          effort: "medium",
        },
  });

  // Renders without JS — gates everything, but only when the emptiness is caused by
  // client-side rendering. A genuinely short page is thin content, not a blocked one.
  const jsShell =
    !e.renderedWithoutJs &&
    (e.frameworkHint !== null || e.html.htmlBytes > 20_000 || e.html.textToHtmlRatio < 0.02);
  checks.push({
    id: "renders-without-js",
    category: "extractability",
    label: "Content renders without JavaScript",
    status: e.renderedWithoutJs ? "pass" : jsShell ? "fail" : "warn",
    value: e.renderedWithoutJs ? 1 : 0,
    weight: jsShell ? 0 : 6,
    gate: jsShell ? "all" : undefined,
    evidence: e.renderedWithoutJs
      ? `${e.html.textWords} words present in the server HTML.`
      : jsShell
        ? `Only ${e.html.textWords} words in ${Math.round(e.html.htmlBytes / 1024)}KB of server HTML${e.frameworkHint ? ` (${e.frameworkHint} detected)` : ""} — the content is being drawn by JavaScript after load.`
        : `Only ${e.html.textWords} words on the page. The HTML renders fine; there is simply very little on it.`,
    fix: e.renderedWithoutJs
      ? undefined
      : jsShell
        ? {
            summary: "Server-render the main content",
            detail:
              "AI crawlers read the HTML they are served; most do not execute JavaScript. " +
              (e.frameworkHint ? `${e.frameworkHint} supports server-side rendering or static generation — ` : "") +
              "move the page body into the server response so the text exists before any script runs.",
            effort: "large",
          }
        : {
            summary: "There is not enough content here to cite",
            detail:
              "An assistant needs a passage it can quote. Under ~200 words there is rarely a self-contained answer to lift. " +
              "Aim for at least a few hundred words of substantive, specific content.",
            effort: "medium",
          },
  });

  // Meta robots / X-Robots-Tag noindex is a separate, common own-goal.
  const noindex =
    /noindex/i.test(e.robots.metaRobots ?? "") || /noindex/i.test(e.robots.xRobotsTag ?? "");
  checks.push({
    id: "no-noindex",
    category: "retrievability",
    label: "Page is indexable",
    status: noindex ? "fail" : "pass",
    value: noindex ? 0 : 1,
    weight: 3,
    evidence: noindex
      ? `noindex found in ${e.robots.metaRobots ? `<meta name="robots" content="${e.robots.metaRobots}">` : `X-Robots-Tag: ${e.robots.xRobotsTag}`}`
      : e.robots.metaRobots
        ? `<meta name="robots" content="${e.robots.metaRobots}">`
        : "No noindex directive.",
    fix: noindex
      ? {
          summary: "Remove the noindex directive",
          detail:
            "A noindex tag keeps this page out of the search indexes that Google AI Overviews, ChatGPT and Copilot draw from.",
          effort: "trivial",
        }
      : undefined,
  });

  // CCBot: blocking it is good practice, not a penalty. Reported as information.
  const ccbot = e.robots.rules["CCBot"];
  checks.push({
    id: "ccbot-posture",
    category: "machine-readability",
    label: "Training-only crawler (CCBot)",
    status: "na",
    value: 1,
    weight: 0,
    evidence: ccbot?.allowed
      ? "CCBot is allowed. It is training-only — blocking it would cost you no citations."
      : "CCBot is blocked. That is the right trade if you want citations without training use.",
  });

  return checks;
}
