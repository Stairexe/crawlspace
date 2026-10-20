import { crossSite, fail, ok, storageFailure } from "@/lib/http";
import { deleteAudit, getAudit } from "@/lib/accounts";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return fail(401, "SIGNED_OUT", "Sign in to open saved audits.");
  const { id } = await params;
  try {
    const saved = await getAudit(user.id, id);
    if (!saved) return fail(404, "NOT_FOUND", "No saved audit with that id.");
    return ok(saved);
  } catch (err) {
    return storageFailure(err);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (crossSite(req)) return fail(403, "CROSS_SITE", "Cross-site request refused.");
  const user = await currentUser();
  if (!user) return fail(401, "SIGNED_OUT", "Sign in first.");
  const { id } = await params;
  try {
    if (!(await deleteAudit(user.id, id))) return fail(404, "NOT_FOUND", "No saved audit with that id.");
    return ok({ ok: true });
  } catch (err) {
    return storageFailure(err);
  }
}
