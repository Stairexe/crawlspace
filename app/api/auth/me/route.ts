import { ok } from "@/lib/http";
import { toPublic } from "@/lib/accounts";
import { accountsEnabled, currentUser } from "@/lib/session";
import { storageKind } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  return ok({
    user: user ? toPublic(user) : null,
    accounts: accountsEnabled(),
    storage: storageKind(),
  });
}
