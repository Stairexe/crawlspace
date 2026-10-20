import { body, crossSite, fail, ok, storageFailure, ACCOUNTS_OFF_MESSAGE } from "@/lib/http";
import { passwordProblem, validateEmail } from "@/lib/auth";
import { createUser, EmailTakenError, toPublic } from "@/lib/accounts";
import { accountsEnabled, startSession } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (crossSite(req)) return fail(403, "CROSS_SITE", "Cross-site request refused.");
  if (!accountsEnabled()) return fail(503, "ACCOUNTS_OFF", ACCOUNTS_OFF_MESSAGE);
  const limit = rateLimit(req, "signup", 5, 60 * 60_000);
  if (!limit.ok) return fail(429, "RATE_LIMITED", `Too many sign-ups from here. Try again in ${limit.retryInSeconds}s.`);

  const b = await body<{ email?: unknown; password?: unknown; name?: unknown }>(req);
  if (!b) return fail(400, "BAD_BODY", "Expected a JSON body.");
  const email = validateEmail(b.email);
  if (!email) return fail(400, "BAD_EMAIL", "Enter a valid email address.");
  const problem = passwordProblem(b.password);
  if (problem) return fail(400, "WEAK_PASSWORD", problem);
  const name = typeof b.name === "string" ? b.name : "";

  try {
    const user = await createUser(email, b.password as string, name);
    await startSession(user);
    return ok({ user: toPublic(user) }, 201);
  } catch (err) {
    if (err instanceof EmailTakenError) return fail(409, "EMAIL_TAKEN", err.message);
    return storageFailure(err);
  }
}
