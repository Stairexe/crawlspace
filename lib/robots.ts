import type { Engine, RobotRule, RobotsRuleExplanation } from "./types";

/**
 * The AI user agents that matter, what each one is for, and which engine it gates.
 *
 * Only crawlers that fetch pages for an engine's *answers* can gate that engine:
 * its search indexer and its user-triggered fetcher. Training crawlers (GPTBot,
 * ClaudeBot, Google-Extended, CCBot, …) are reported but never gate or penalise an
 * engine — each operator documents that blocking them does not remove a site from
 * its search or answers. Assistants Crawlspace does not score (Apple, Meta, DuckDuckGo,
 * Mistral, …) are reported as "other" so the robots.txt picture is complete.
 * Tokens as published by each operator; cross-checked Sep 2026.
 */
export interface AgentSpec {
  agent: string;
  operator: string;
  engine: Engine | "training" | "other";
  crawlerType: "search" | "training" | "browsing";
  role: string;
}

export const AI_AGENTS: AgentSpec[] = [
  // Scored engines: the agents whose access decides citation.
  { agent: "Googlebot", operator: "Google", engine: "google-aio", crawlerType: "search", role: "Google Search index — the only index AI Overviews draw on" },
  { agent: "OAI-SearchBot", operator: "OpenAI", engine: "chatgpt", crawlerType: "search", role: "ChatGPT search index — citations" },
  { agent: "ChatGPT-User", operator: "OpenAI", engine: "chatgpt", crawlerType: "browsing", role: "ChatGPT fetching a page a user asked about" },
  { agent: "Claude-SearchBot", operator: "Anthropic", engine: "claude", crawlerType: "search", role: "Claude search index — citations" },
  { agent: "Claude-User", operator: "Anthropic", engine: "claude", crawlerType: "browsing", role: "Claude fetching a page a user asked about" },
  { agent: "PerplexityBot", operator: "Perplexity", engine: "perplexity", crawlerType: "search", role: "Perplexity search index — citations" },
  { agent: "Perplexity-User", operator: "Perplexity", engine: "perplexity", crawlerType: "browsing", role: "Perplexity fetching a page a user asked about" },
  { agent: "Bingbot", operator: "Microsoft", engine: "copilot", crawlerType: "search", role: "Bing index — powers Microsoft Copilot answers" },
  // Training crawlers: reported, never gate an engine.
  { agent: "GPTBot", operator: "OpenAI", engine: "training", crawlerType: "training", role: "Model training — blocking it does not affect ChatGPT search" },
  { agent: "ClaudeBot", operator: "Anthropic", engine: "training", crawlerType: "training", role: "Model training — blocking it does not affect Claude search" },
  { agent: "anthropic-ai", operator: "Anthropic", engine: "training", crawlerType: "training", role: "Legacy Anthropic training token" },
  { agent: "Google-Extended", operator: "Google", engine: "training", crawlerType: "training", role: "Gemini training control — does not affect Search or AI Overviews" },
  { agent: "Applebot-Extended", operator: "Apple", engine: "training", crawlerType: "training", role: "Apple Intelligence training control" },
  { agent: "meta-externalagent", operator: "Meta", engine: "training", crawlerType: "training", role: "Meta model training" },
  { agent: "Bytespider", operator: "ByteDance", engine: "training", crawlerType: "training", role: "ByteDance model training" },
  { agent: "Amazonbot", operator: "Amazon", engine: "training", crawlerType: "training", role: "Alexa and Amazon AI services" },
  { agent: "CCBot", operator: "Common Crawl", engine: "training", crawlerType: "training", role: "Open web archive used for training — safe to block" },
  // Other assistants: reported, not scored.
  { agent: "Gemini-Deep-Research", operator: "Google", engine: "other", crawlerType: "browsing", role: "Gemini Deep Research agent" },
  { agent: "Google-CloudVertexBot", operator: "Google", engine: "other", crawlerType: "browsing", role: "Vertex AI agents built by site owners" },
  { agent: "Meta-WebIndexer", operator: "Meta", engine: "other", crawlerType: "search", role: "Meta AI search and citations" },
  { agent: "Applebot", operator: "Apple", engine: "other", crawlerType: "search", role: "Siri and Spotlight results" },
  { agent: "DuckAssistBot", operator: "DuckDuckGo", engine: "other", crawlerType: "search", role: "DuckDuckGo AI answers" },
  { agent: "MistralAI-User", operator: "Mistral", engine: "other", crawlerType: "browsing", role: "Le Chat fetching pages for citations" },
];

/** Agents whose access gates a scored engine. */
export function isCitationAgent(spec: AgentSpec): spec is AgentSpec & { engine: Engine } {
  return spec.engine !== "training" && spec.engine !== "other" && spec.crawlerType !== "training";
}

export function explainRobotsFile(raw: string | null): RobotsRuleExplanation[] {
  if (!raw) return [];
  const lines = raw.split(/\r?\n/);
  const out: RobotsRuleExplanation[] = [];
  let currentAgents: string[] = [];

  for (const line of lines) {
    const clean = line.split("#")[0].trim();
    if (!clean) continue;
    const idx = clean.indexOf(":");
    if (idx === -1) continue;
    const field = clean.slice(0, idx).trim().toLowerCase();
    const value = clean.slice(idx + 1).trim();

    if (field === "user-agent") {
      currentAgents.push(value);
    } else if (field === "disallow" || field === "allow") {
      const agentNames = currentAgents.length > 0 ? currentAgents.join(", ") : "*";
      const isAllowed = field === "allow";
      let explanation = "";
      if (value === "" && field === "disallow") {
        explanation = `Grants full access: "${agentNames}" is allowed to crawl the entire site.`;
      } else if (value === "/" && field === "disallow") {
        explanation = `Full lockout: "${agentNames}" is blocked from crawling any page on this domain.`;
      } else if (field === "disallow") {
        explanation = `Blocks "${agentNames}" from crawling URLs beginning with or matching "${value}".`;
      } else {
        explanation = `Explicitly allows "${agentNames}" to crawl URLs matching "${value}".`;
      }
      out.push({
        agent: agentNames,
        directive: `${field.toUpperCase()}: ${value || "(empty)"}`,
        path: value,
        explanation,
        allowed: isAllowed,
      });
    }
  }
  return out;
}

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
    if (!isCitationAgent(spec)) continue;
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
