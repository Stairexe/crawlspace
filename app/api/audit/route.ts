import { NextResponse } from "next/server";
import { gatherEvidence } from "@/lib/extract";
import { runChecks, scoreReport } from "@/lib/scoring/score";
import { FetchGuardError } from "@/lib/fetcher";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(req, "audit", 12, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${limit.retryInSeconds}s.`, code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Expected a JSON body.", code: "BAD_BODY" }, { status: 400 });
  }

  if (typeof url !== "string" || url.trim().length === 0) {
    return NextResponse.json({ error: "Enter a URL to audit.", code: "EMPTY_URL" }, { status: 400 });
  }
  if (url.length > 2048) {
    return NextResponse.json({ error: "That URL is too long.", code: "URL_TOO_LONG" }, { status: 400 });
  }

  try {
    const evidence = await gatherEvidence(url);

    // A non-2xx page produces a report full of zeros that means nothing. Say what
    // actually happened instead of scoring an error page.
    if (evidence.status < 200 || evidence.status >= 300) {
      const blocked = evidence.status === 403 || evidence.status === 401 || evidence.status === 429;
      return NextResponse.json(
        {
          error: blocked
            ? `That site answered HTTP ${evidence.status} to our request. Sites behind bot protection often refuse automated audits — which does not by itself mean the AI crawlers are blocked, only that we cannot read the page from here.`
            : `That page answered HTTP ${evidence.status}, so there is nothing to audit.`,
          code: "UPSTREAM_STATUS",
        },
        { status: 422 },
      );
    }

    const checks = runChecks(evidence);
    const report = scoreReport(evidence, checks);
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof FetchGuardError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    console.error("[audit] unexpected", err);
    return NextResponse.json(
      { error: "The audit failed while reading that page. It may be blocking automated requests.", code: "AUDIT_FAILED" },
      { status: 502 },
    );
  }
}
