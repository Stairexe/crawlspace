import { body, crossSite, fail, ok, storageFailure, ACCOUNTS_OFF_MESSAGE } from "@/lib/http";
import { validateEmail } from "@/lib/auth";
import { authenticate, toPublic } from "@/lib/accounts";
import { accountsEnabled, startSession } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (crossSite(req)) return fail(403, "CROSS_SITE", "Cross-site request refused.");
  if (!accountsEnabled()) return fail(503, "ACCOUNTS_OFF", ACCOUNTS_OFF_MESSAGE);
  const limit = rateLimit(req, "login", 10, 15 * 60_000);
  if (!limit.ok) return fail(429, "RATE_LIMITED", `Too many attempts. Try again in ${limit.retryInSeconds}s.`);

  const b = await body<{ email?: unknown; password?: unknown }>(req);
  if (!b) return fail(400, "BAD_BODY", "Expected a JSON body.");
  const email = validateEmail(b.email);
  if (!email || typeof b.password !== "string" || !b.password) {
    return fail(400, "BAD_CREDENTIALS", "Enter your email and password.");
  }

  try {
    const user = await authenticate(email, b.password);
    if (!user) return fail(401, "WRONG_CREDENTIALS", "That email and password do not match an account.");
    await startSession(user);
    return ok({ user: toPublic(user) });
  } catch (err) {
    return storageFailure(err);
  }
}
