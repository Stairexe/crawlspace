import { body, crossSite, fail, ok, storageFailure } from "@/lib/http";
import { passwordProblem, verifyPassword } from "@/lib/auth";
import { changePassword, deleteUser, toPublic, updateUser } from "@/lib/accounts";
import { currentUser, endSession, startSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Update the display name, or change the password (which signs out other sessions). */
export async function PATCH(req: Request) {
  if (crossSite(req)) return fail(403, "CROSS_SITE", "Cross-site request refused.");
  const user = await currentUser();
  if (!user) return fail(401, "SIGNED_OUT", "Sign in first.");
  const b = await body<{ name?: unknown; currentPassword?: unknown; newPassword?: unknown }>(req);
  if (!b) return fail(400, "BAD_BODY", "Expected a JSON body.");

  try {
    let next = user;
    if (typeof b.name === "string") {
      const name = b.name.trim().slice(0, 80);
      if (!name) return fail(400, "BAD_NAME", "Enter a name.");
      next = { ...next, name };
      await updateUser(next);
    }
    if (b.newPassword !== undefined) {
      if (typeof b.currentPassword !== "string" || !(await verifyPassword(b.currentPassword, user.passwordHash))) {
        return fail(401, "WRONG_PASSWORD", "Your current password is not right.");
      }
      const problem = passwordProblem(b.newPassword);
      if (problem) return fail(400, "WEAK_PASSWORD", problem);
      next = await changePassword(next, b.newPassword as string);
      await startSession(next);
    }
    return ok({ user: toPublic(next) });
  } catch (err) {
    return storageFailure(err);
  }
}

/** Deletes the account and every saved audit and share link. Needs the password. */
export async function DELETE(req: Request) {
  if (crossSite(req)) return fail(403, "CROSS_SITE", "Cross-site request refused.");
  const user = await currentUser();
  if (!user) return fail(401, "SIGNED_OUT", "Sign in first.");
  const b = await body<{ password?: unknown }>(req);
  if (!b || typeof b.password !== "string" || !(await verifyPassword(b.password, user.passwordHash))) {
    return fail(401, "WRONG_PASSWORD", "Enter your password to delete the account.");
  }
  try {
    await deleteUser(user);
    await endSession();
    return ok({ ok: true });
  } catch (err) {
    return storageFailure(err);
  }
}
