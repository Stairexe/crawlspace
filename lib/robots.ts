import type { Engine, RobotRule } from "./types";

/**
 * The AI user agents that matter, and which engine each one gates.
 * Source: research/SUMMARY.md §Per-engine crawler map.
 */
export interface AgentSpec {
  agent: string;
  engine: Engine | "training";
  role: string;
}

export const AI_AGENTS: AgentSpec[] = [
  { agent: "GPTBot", engine: "chatgpt", role: "OpenAI index + training" },
  { agent: "OAI-SearchBot", engine: "chatgpt", role: "ChatGPT search index" },
  { agent: "ChatGPT-User", engine: "chatgpt", role: "ChatGPT live browsing" },
  { agent: "PerplexityBot", engine: "perplexity", role: "Perplexity index" },
  { agent: "Perplexity-User", engine: "perplexity", role: "Perplexity live fetch" },
  { agent: "ClaudeBot", engine: "claude", role: "Anthropic index" },
  { agent: "Claude-User", engine: "claude", role: "Claude live browsing" },
  { agent: "Claude-SearchBot", engine: "claude", role: "Claude search index" },
  { agent: "anthropic-ai", engine: "claude", role: "Anthropic (legacy agent)" },
  { agent: "Google-Extended", engine: "google-aio", role: "Gemini / AI Overviews grounding" },
  { agent: "Bingbot", engine: "copilot", role: "Bing index — powers Copilot" },
  { agent: "CCBot", engine: "training", role: "Common Crawl — training only, safe to block" },
];

interface Group {
  agents: string[];
  allow: string[];
  disallow: string[];
}

/** Parse robots.txt into user-agent groups. Handles multi-agent group headers. */
export function parseRobots(raw: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;

  for (const line of raw.split(/\r?\n/)) {
    const clean = line.split("#")[0].trim();
    if (!clean) continue;
    const idx = clean.indexOf(":");
    if (idx === -1) continue;
    const field = clean.slice(0, idx).trim().toLowerCase();
    const value = clean.slice(idx + 1).trim();

    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], allow: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    if (!current) continue;
    lastWasAgent = false;
    if (field === "allow") current.allow.push(value);
    else if (field === "disallow") current.disallow.push(value);
  }
  return groups;
}

function specificity(pattern: string): number {
  return pattern.replace(/\*/g, "").length;
}

/** Does a robots path pattern match the given path? Supports * and $. */
function patternMatches(pattern: string, path: string): boolean {
  if (pattern === "") return false;
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  const anchoredEnd = escaped.endsWith("\\$");
  const body = anchoredEnd ? escaped.slice(0, -2) + "$" : escaped;
  try {
    return new RegExp("^" + body).test(path);
  } catch {
    return false;
  }
}

/**
 * Resolve whether a named agent may fetch `path`.
 * Group precedence: the most specific matching user-agent group wins; `*` is the fallback.
 * Within a group, the longest matching rule wins; Allow beats Disallow on a tie.
 */
export function resolveAgent(
  groups: Group[],
  agent: string,
  path: string,
): { allowed: boolean; reason: string; matchedLine?: string } {
  const lower = agent.toLowerCase();
  const exact = groups.filter((g) => g.agents.includes(lower));
  const partial = groups.filter((g) =>
    g.agents.some((a) => a !== "*" && (lower.includes(a) || a.includes(lower))),
  );
  const wildcard = groups.filter((g) => g.agents.includes("*"));
  const applicable = exact.length ? exact : partial.length ? partial : wildcard;

  if (applicable.length === 0) {
    return { allowed: true, reason: "No matching rule — allowed by default." };
  }

  let best: { allowed: boolean; pattern: string; len: number } | null = null;
  for (const g of applicable) {
    for (const d of g.disallow) {
      if (d === "") continue; // "Disallow:" with empty value means allow all
      if (patternMatches(d, path)) {
        const len = specificity(d);
        if (!best || len > best.len) best = { allowed: false, pattern: d, len };
      }
    }
    for (const a of g.allow) {
      if (patternMatches(a, path)) {
        const len = specificity(a);
        if (!best || len >= best.len) best = { allowed: true, pattern: a, len };
      }
    }
  }

  const via = exact.length ? `explicit "${agent}" group` : partial.length ? "matching group" : "the * group";
  if (!best) {
    return { allowed: true, reason: `No rule in ${via} blocks this path.` };
  }
  return {
    allowed: best.allowed,
    reason: best.allowed
      ? `Allowed by "Allow: ${best.pattern}" in ${via}.`
      : `Blocked by "Disallow: ${best.pattern}" in ${via}.`,
    matchedLine: `${best.allowed ? "Allow" : "Disallow"}: ${best.pattern}`,
  };
}

export function resolveAllAgents(
  raw: string | null,
  path: string,
): Record<string, RobotRule> {
  const out: Record<string, RobotRule> = {};
  if (raw === null) {
    for (const spec of AI_AGENTS) {
      out[spec.agent] = {
        agent: spec.agent,
        allowed: true,
        reason: "No robots.txt found — everything is allowed by default.",
      };
    }
    return out;
  }
  const groups = parseRobots(raw);
  for (const spec of AI_AGENTS) {
    const r = resolveAgent(groups, spec.agent, path);
    out[spec.agent] = { agent: spec.agent, ...r };
  }
  return out;
}

/** Engines that are fully blocked — every agent serving that engine is disallowed. */
export function blockedEngines(rules: Record<string, RobotRule>): Engine[] {
  const byEngine = new Map<Engine, boolean[]>();
  for (const spec of AI_AGENTS) {
    if (spec.engine === "training") continue;
    const rule = rules[spec.agent];
    if (!rule) continue;
    const list = byEngine.get(spec.engine) ?? [];
    list.push(rule.allowed);
    byEngine.set(spec.engine, list);
  }
  const blocked: Engine[] = [];
  for (const [engine, results] of byEngine) {
    if (results.length > 0 && results.every((allowed) => !allowed)) blocked.push(engine);
  }
  return blocked;
}
