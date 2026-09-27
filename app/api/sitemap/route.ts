import { NextResponse } from "next/server";
import { planSite } from "@/lib/sitemap";
import { FetchGuardError } from "@/lib/fetcher";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(req, "sitemap", 4, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Site surveys are limited to 4 per 10 minutes. Try again in ${limit.retryInSeconds}s.`, code: "RATE_LIMITED" },
      { status: 429 },
    );
  }
  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Expected a JSON body.", code: "BAD_BODY" }, { status: 400 });
  }
  if (typeof url !== "string" || !url.trim() || url.length > 2048) {
    return NextResponse.json({ error: "Enter a site to survey.", code: "EMPTY_URL" }, { status: 400 });
  }
  try {
    return NextResponse.json(await planSite(url), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof FetchGuardError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    console.error("[sitemap] unexpected", err);
    return NextResponse.json({ error: "Could not read that site's pages.", code: "SITEMAP_FAILED" }, { status: 502 });
  }
}
