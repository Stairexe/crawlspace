import { fail, ok, storageFailure } from "@/lib/http";
import { listAudits } from "@/lib/accounts";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return fail(401, "SIGNED_OUT", "Sign in to see saved audits.");
  try {
    return ok({ audits: await listAudits(user.id) });
  } catch (err) {
    return storageFailure(err);
  }
}
