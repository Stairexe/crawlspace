import { AI_AGENTS, type AgentSpec } from "./robots";

/**
 * Server-log analysis for AI crawlers. Pure and line-based so it can stream a large
 * file in the browser: nothing is uploaded. Understands the common/combined log format
 * (nginx, Apache) and JSON-lines exports with path / status / user-agent fields; any
 * line that mentions a known agent token is counted even if the rest cannot be parsed.
 *
 * User agents can be spoofed. Counts here are claims made by the requester; confirming
 * a hit is genuine needs the operator's published IP ranges or a reverse-DNS check.
 */
export interface AgentHits {
  spec: AgentSpec;
  hits: number;
  paths: Map<string, number>;
  statuses: Map<string, number>;
  first?: string;
  last?: string;
}

export interface LogSummary {
  lines: number;
  matched: number;
  agents: Map<string, AgentHits>;
}

const TOKENS = AI_AGENTS.map((spec) => ({ spec, needle: spec.agent.toLowerCase() }))
  // Longer tokens first so "Claude-SearchBot" is not counted as "ClaudeBot"-like substrings.
  .sort((a, b) => b.needle.length - a.needle.length);

export function newSummary(): LogSummary {
  return { lines: 0, matched: 0, agents: new Map() };
}

function field(line: string, names: string[]): string | undefined {
  for (const n of names) {
    const m = line.match(new RegExp(`"${n}"\\s*:\\s*"?([^",}]+)`, "i"));
    if (m) return m[1];
  }
  return undefined;
}

export function addLine(sum: LogSummary, line: string): void {
  if (!line.trim()) return;
  sum.lines++;
  const lower = line.toLowerCase();
  const hit = TOKENS.find((t) => lower.includes(t.needle));
  if (!hit) return;
  sum.matched++;

  const path =
    line.match(/"(?:GET|POST|HEAD|PUT|OPTIONS) (\S+)/)?.[1] ??
    field(line, ["path", "requestPath", "request_path", "url", "uri"]) ??
    "(unknown path)";
  const status =
    line.match(/" (\d{3}) /)?.[1] ?? field(line, ["status", "statusCode", "status_code", "responseStatusCode"]) ?? "?";
  const when =
    line.match(/\[([^\]]+)\]/)?.[1] ?? field(line, ["timestamp", "time", "date", "ts"]);

  const key = hit.spec.agent;
  const a: AgentHits = sum.agents.get(key) ?? { spec: hit.spec, hits: 0, paths: new Map(), statuses: new Map() };
  a.hits++;
  a.paths.set(path, (a.paths.get(path) ?? 0) + 1);
  a.statuses.set(status, (a.statuses.get(status) ?? 0) + 1);
  if (when) {
    a.first = a.first ?? when;
    a.last = when;
  }
  sum.agents.set(key, a);
}
