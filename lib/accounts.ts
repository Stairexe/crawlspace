import type {
  AuditReport,
  PublicUser,
  SavedAudit,
  SavedAuditSummary,
  UserRecord,
} from "@/lib/types";
import { delKeys, getJSON, listKeys, putJSON } from "@/lib/store";
import { emailKey, hashPassword, newId, verifyPassword } from "@/lib/auth";
import { summarise } from "@/lib/auditSummary";

/**
 * Accounts and saved audits on top of lib/store.ts.
 *
 * Layout:
 *   emails/<sha256(email)>.json          → { id }
 *   users/<id>/user.json                 → UserRecord
 *   users/<id>/index.json                → SavedAuditSummary[] (newest first)
 *   users/<id>/audits/<auditId>.json     → SavedAudit
 *   shares/<shareId>.json                → { userId, auditId }
 */

const MAX_HISTORY = 500;
const ID_RE = /^[a-f0-9]{16,64}$/;

export function isId(v: unknown): v is string {
  return typeof v === "string" && ID_RE.test(v);
}

export function toPublic(u: UserRecord): PublicUser {
  return { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt };
}

export async function getUser(id: string): Promise<UserRecord | null> {
  if (!isId(id)) return null;
  return getJSON<UserRecord>(`users/${id}/user.json`);
}

export class EmailTakenError extends Error {}

export async function createUser(email: string, password: string, name: string): Promise<UserRecord> {
  const ek = `emails/${emailKey(email)}.json`;
  if (await getJSON<{ id: string }>(ek)) throw new EmailTakenError("An account with that email already exists.");
  const user: UserRecord = {
    id: newId(),
    email,
    name: name.trim().slice(0, 80) || email.split("@")[0],
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await putJSON(`users/${user.id}/user.json`, user);
  await putJSON(ek, { id: user.id });
  await putJSON(`users/${user.id}/index.json`, []);
  return user;
}

/** The user for these credentials, or null. Same answer and similar time either way. */
export async function authenticate(email: string, password: string): Promise<UserRecord | null> {
  const ref = await getJSON<{ id: string }>(`emails/${emailKey(email)}.json`);
  const user = ref ? await getUser(ref.id) : null;
  // Verify against a throwaway hash when there is no user, so timing does not reveal
  // which emails have accounts.
  const ok = await verifyPassword(
    password,
    user?.passwordHash ?? "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  );
  return user && ok ? user : null;
}

export async function updateUser(user: UserRecord): Promise<void> {
  await putJSON(`users/${user.id}/user.json`, user);
}

export async function changePassword(user: UserRecord, next: string): Promise<UserRecord> {
  const updated = { ...user, passwordHash: await hashPassword(next) };
  await updateUser(updated);
  return updated;
}

export async function deleteUser(user: UserRecord): Promise<void> {
  const index = await listAudits(user.id);
  const shareKeys = index.filter((s) => s.shareId).map((s) => `shares/${s.shareId}.json`);
  const own = await listKeys(`users/${user.id}/`);
  await delKeys([...own, ...shareKeys, `emails/${emailKey(user.email)}.json`]);
}

// ── Saved audits ────────────────────────────────────────────────────────────
export async function listAudits(userId: string): Promise<SavedAuditSummary[]> {
  if (!isId(userId)) return [];
  return (await getJSON<SavedAuditSummary[]>(`users/${userId}/index.json`)) ?? [];
}

async function writeIndex(userId: string, rows: SavedAuditSummary[]): Promise<void> {
  await putJSON(`users/${userId}/index.json`, rows.slice(0, MAX_HISTORY));
}

export async function saveAudit(userId: string, report: AuditReport): Promise<SavedAuditSummary> {
  const id = newId();
  const summary = summarise(id, report);
  await putJSON(`users/${userId}/audits/${id}.json`, { summary, report } satisfies SavedAudit);
  const rows = await listAudits(userId);
  const next = [summary, ...rows];
  // History is capped; reports that fall off the end are deleted with it.
  const dropped = next.slice(MAX_HISTORY);
  await writeIndex(userId, next);
  if (dropped.length) {
    await delKeys(dropped.map((d) => `users/${userId}/audits/${d.id}.json`));
  }
  return summary;
}

export async function getAudit(userId: string, auditId: string): Promise<SavedAudit | null> {
  if (!isId(userId) || !isId(auditId)) return null;
  return getJSON<SavedAudit>(`users/${userId}/audits/${auditId}.json`);
}

export async function deleteAudit(userId: string, auditId: string): Promise<boolean> {
  const rows = await listAudits(userId);
  const row = rows.find((r) => r.id === auditId);
  if (!row) return false;
  await writeIndex(
    userId,
    rows.filter((r) => r.id !== auditId),
  );
  await delKeys([
    `users/${userId}/audits/${auditId}.json`,
    ...(row.shareId ? [`shares/${row.shareId}.json`] : []),
  ]);
  return true;
}

/** Turns the public link for an audit on or off. Returns the share id when on. */
export async function setShared(userId: string, auditId: string, on: boolean): Promise<string | null> {
  const rows = await listAudits(userId);
  const idx = rows.findIndex((r) => r.id === auditId);
  if (idx < 0) throw new Error("not found");
  const row = rows[idx];
  if (on) {
    if (row.shareId) return row.shareId;
    const shareId = newId(10);
    await putJSON(`shares/${shareId}.json`, { userId, auditId });
    rows[idx] = { ...row, shareId };
    await writeIndex(userId, rows);
    const saved = await getAudit(userId, auditId);
    if (saved) await putJSON(`users/${userId}/audits/${auditId}.json`, { ...saved, summary: rows[idx] });
    return shareId;
  }
  if (row.shareId) await delKeys([`shares/${row.shareId}.json`]);
  rows[idx] = { ...row, shareId: undefined };
  await writeIndex(userId, rows);
  return null;
}

export async function getShared(shareId: string): Promise<SavedAudit | null> {
  if (!isId(shareId)) return null;
  const ref = await getJSON<{ userId: string; auditId: string }>(`shares/${shareId}.json`);
  if (!ref) return null;
  return getAudit(ref.userId, ref.auditId);
}
