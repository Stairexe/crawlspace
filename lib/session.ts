import { cookies } from "next/headers";
import type { UserRecord } from "@/lib/types";
import { authSecret, createSessionToken, readSessionToken, sessionVersion, SESSION_TTL_SECONDS } from "@/lib/auth";
import { getUser } from "@/lib/accounts";
import { storageEnabled } from "@/lib/store";

/** Cookie plumbing for server components and route handlers. */

export const SESSION_COOKIE = "cs_session";

/** Accounts work only with both a signing secret and somewhere to keep them. */
export function accountsEnabled(): boolean {
  return authSecret() !== null && storageEnabled();
}

export async function currentUser(): Promise<UserRecord | null> {
  const secret = authSecret();
  if (!secret || !storageEnabled()) return null;
  const jar = await cookies();
  const payload = readSessionToken(jar.get(SESSION_COOKIE)?.value, secret);
  if (!payload) return null;
  try {
    const user = await getUser(payload.uid);
    if (!user || sessionVersion(user.passwordHash) !== payload.sv) return null;
    return user;
  } catch {
    return null;
  }
}

export async function startSession(user: UserRecord): Promise<void> {
  const secret = authSecret();
  if (!secret) return;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(user.id, user.passwordHash, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
