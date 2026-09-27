import { NextResponse } from "next/server";
import { gatherEvidence } from "@/lib/extract";
import { runChecks, scoreReport } from "@/lib/scoring/score";
import { FetchGuardError } from "@/lib/fetcher";
import { rateLimit } from "@/lib/ratelimit";
import { compactReport } from "@/lib/summary";

/**
 * Crawlspace as an MCP server (Streamable HTTP, JSON responses, stateless).
 * One tool: audit_url. Add it to any MCP client with the URL of this endpoint.
 * Same engine, same guards and same rate limit as the website.
 */
export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const PROTOCOL = "2025-06-18";

const TOOLS = [
  {
    name: "audit_url",
    title: "Survey a page for AI citability",
    description:
      "Fetch one public web page the way an AI crawler does and score how citable it is for ChatGPT, Claude, Perplexity, Copilot and Google AI Overviews. Returns per-engine scores (with gates when a crawler is blocked), a fix-first plan with projected score gains, all findings with literal evidence, and the weakest passages. No API key needed.",
    inputSchema: {
      type: "object",
      properties: { url: { type: "string", description: "The page to survey, e.g. https://example.com/pricing" } },
      required: ["url"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
];

type Rpc = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

function result(id: Rpc["id"], res: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result: res };
}
function failure(id: Rpc["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

async function handle(req: Request, msg: Rpc) {
  switch (msg.method) {
    case "initialize":
      return result(msg.id, {
        protocolVersion: (msg.params?.protocolVersion as string) ?? PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "crawlspace", title: "Crawlspace", version: "1.0.0" },
        instructions:
          "Use audit_url to check whether a page can be cited by AI assistants. Scores are Crawlspace's model, published at /methodology; they do not measure actual citations.",
      });
    case "ping":
      return result(msg.id, {});
    case "tools/list":
      return result(msg.id, { tools: TOOLS });
    case "tools/call": {
      const name = msg.params?.name;
      const url = (msg.params?.arguments as { url?: unknown } | undefined)?.url;
      if (name !== "audit_url") return failure(msg.id, -32602, `Unknown tool: ${String(name)}`);
      if (typeof url !== "string" || !url.trim()) {
        return result(msg.id, { isError: true, content: [{ type: "text", text: "Provide a url to survey." }] });
      }
      const limit = rateLimit(req, "audit", 12, 10 * 60_000);
      if (!limit.ok) {
        return result(msg.id, { isError: true, content: [{ type: "text", text: `Rate limit reached. Try again in ${limit.retryInSeconds}s.` }] });
      }
      try {
        const evidence = await gatherEvidence(url);
        if (evidence.status < 200 || evidence.status >= 300) {
          return result(msg.id, {
            isError: true,
            content: [{ type: "text", text: `The page answered HTTP ${evidence.status}; there is nothing to score.` }],
          });
        }
        const compact = compactReport(scoreReport(evidence, runChecks(evidence)));
        return result(msg.id, {
          content: [{ type: "text", text: JSON.stringify(compact, null, 2) }],
          structuredContent: compact,
        });
      } catch (err) {
        const text = err instanceof FetchGuardError ? err.message : "The survey failed while reading that page.";
        return result(msg.id, { isError: true, content: [{ type: "text", text }] });
      }
    }
    default:
      if (msg.method?.startsWith("notifications/")) return null;
      return failure(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(failure(null, -32700, "Parse error"), { status: 400 });
  }
  const batch = Array.isArray(body) ? (body as Rpc[]) : [body as Rpc];
  const out = (await Promise.all(batch.map((m) => handle(req, m)))).filter(Boolean);
  if (out.length === 0) return new Response(null, { status: 202 });
  return NextResponse.json(Array.isArray(body) ? out : out[0], {
    headers: { "Cache-Control": "no-store", "MCP-Protocol-Version": PROTOCOL },
  });
}

export async function GET() {
  // No server-initiated stream: this server only answers requests.
  return new Response("Crawlspace MCP endpoint. POST JSON-RPC here; see /developers.", {
    status: 405,
    headers: { Allow: "POST" },
  });
}
