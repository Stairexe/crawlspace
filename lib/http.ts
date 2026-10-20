import { NextResponse } from "next/server";
import { StorageDisabledError } from "@/lib/store";

/** API error in the house shape: `{ error, code }` with a real status. */
export function fail(status: number, code: string, error: string): NextResponse {
  return NextResponse.json({ error, code }, { status, headers: { "Cache-Control": "no-store" } });
}

export function ok(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Mutating account routes refuse cross-site requests. SameSite=Lax already keeps the
 * cookie off cross-site POSTs; this is the second lock.
 */
export function crossSite(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export async function body<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/** Maps storage failures to an honest 503 instead of a stack trace. */
export function storageFailure(err: unknown): NextResponse {
  if (err instanceof StorageDisabledError) {
    return fail(503, "ACCOUNTS_OFF", err.message);
  }
  console.error("[storage]", err);
  return fail(503, "STORAGE_ERROR", "Saved data is unavailable right now. Try again in a moment.");
}

export const ACCOUNTS_OFF_MESSAGE =
  "Accounts are not switched on for this deployment yet. Audits still work without one.";
