import { crossSite, fail, ok } from "@/lib/http";
import { endSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (crossSite(req)) return fail(403, "CROSS_SITE", "Cross-site request refused.");
  await endSession();
  return ok({ ok: true });
}
