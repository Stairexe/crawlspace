import { NextResponse } from "next/server";
import { scoreBlockText } from "@/lib/blocks";
import { rateLimit } from "@/lib/ratelimit";
import {
  ProviderError,
  callProvider,
  defaultProvider,
  parseJsonResponse,
  serverProviders,
  type ProviderName,
} from "@/lib/ai/provider";
import {
  GEO_TACTICS,
  SYSTEM_PROMPT,
  buildUserPrompt,
  tacticsFor,
} from "@/lib/ai/prompts";
import type { BlockKind, RewriteResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface Body {
  blockId?: string;
  text?: string;
  heading?: string;
  kind?: BlockKind;
  pageTitle?: string | null;
  provider?: ProviderName;
  apiKey?: string;
}

interface ModelOutput {
  rewritten?: string;
  changes?: string[];
  needsEvidence?: boolean;
}

/** Availability, so the UI can explain itself rather than just failing. */
export async function GET() {
  return NextResponse.json({
    providers: serverProviders(),
    default: defaultProvider(),
    enabled: serverProviders().length > 0,
  });
}

export async function POST(req: Request) {
  const limit = rateLimit(req, "rewrite", 20, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${limit.retryInSeconds}s.`, code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body.", code: "BAD_BODY" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "No passage supplied.", code: "EMPTY_TEXT" }, { status: 400 });
  }
  if (text.length > 6000) {
    return NextResponse.json(
      { error: "That passage is too long to rewrite in one pass.", code: "TEXT_TOO_LONG" },
      { status: 400 },
    );
  }

  const provider = body.provider ?? defaultProvider() ?? "anthropic";
  const before = scoreBlockText(text, body.kind ?? "paragraph");

  try {
    const result = await callProvider(
      provider,
      {
        system: SYSTEM_PROMPT,
        user: buildUserPrompt({
          text,
          heading: body.heading,
          pageTitle: body.pageTitle ?? null,
          scores: before.scores,
          notes: before.notes,
        }),
        maxTokens: 1400,
      },
      body.apiKey,
    );

    const parsed = parseJsonResponse<ModelOutput>(result.text);
    const rewritten = (parsed.rewritten ?? "").trim();
    if (!rewritten) {
      return NextResponse.json(
        { error: "The model returned an empty rewrite.", code: "EMPTY_REWRITE" },
        { status: 502 },
      );
    }

    const after = scoreBlockText(rewritten, body.kind ?? "paragraph");
    const tacticIds = tacticsFor(before.scores);
    const tacticsApplied = GEO_TACTICS.filter((t) =>
      (tacticIds as readonly string[]).includes(t.id),
    ).map((t) => ({ name: t.name, publishedLift: t.publishedLift }));

    const notes = [...(parsed.changes ?? []).slice(0, 4)];
    if (parsed.needsEvidence) {
      notes.push(
        "This passage would gain most from a figure or a cited source — the rewriter is not allowed to invent one, so that part is yours.",
      );
    }

    const payload: RewriteResult = {
      blockId: body.blockId ?? "block",
      original: text,
      rewritten,
      before: before.scores,
      after: after.scores,
      delta: Math.round((after.scores.total - before.scores.total) * 1000) / 1000,
      tacticsApplied,
      provider: result.model,
      notes,
    };

    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ProviderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    console.error("[rewrite] unexpected", err);
    return NextResponse.json(
      { error: "The rewrite failed.", code: "REWRITE_FAILED" },
      { status: 502 },
    );
  }
}
