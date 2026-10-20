import { body, crossSite, fail, ok, storageFailure } from "@/lib/http";
import { isId, setShared } from "@/lib/accounts";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** `{ on: true }` makes a public read-only link; `{ on: false }` removes it. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (crossSite(req)) return fail(403, "CROSS_SITE", "Cross-site request refused.");
  const user = await currentUser();
  if (!user) return fail(401, "SIGNED_OUT", "Sign in first.");
  const { id } = await params;
  if (!isId(id)) return fail(404, "NOT_FOUND", "No saved audit with that id.");
  const b = await body<{ on?: unknown }>(req);
  try {
    const shareId = await setShared(user.id, id, b?.on !== false);
    return ok({ shareId });
  } catch (err) {
    if (err instanceof Error && err.message === "not found") return fail(404, "NOT_FOUND", "No saved audit with that id.");
    return storageFailure(err);
  }
}
