import { NextResponse } from "next/server";
import { generateJsonLd, generateLlmsTxt, generateRobotsSnippet } from "@/lib/generate";
import type { Evidence } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { kind?: string; evidence?: Evidence };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body.", code: "BAD_BODY" }, { status: 400 });
  }
  const { kind, evidence } = body;
  if (!evidence || typeof evidence !== "object") {
    return NextResponse.json({ error: "No evidence supplied.", code: "NO_EVIDENCE" }, { status: 400 });
  }
  try {
    switch (kind) {
      case "llms.txt":
        return NextResponse.json({ content: generateLlmsTxt(evidence), language: "markdown" });
      case "jsonld":
        return NextResponse.json({ content: generateJsonLd(evidence), language: "html" });
      case "robots":
        return NextResponse.json({ content: generateRobotsSnippet(), language: "text" });
      default:
        return NextResponse.json({ error: "Unknown generator.", code: "BAD_KIND" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Could not generate that file.", code: "GENERATE_FAILED" }, { status: 500 });
  }
}
