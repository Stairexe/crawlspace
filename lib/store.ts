import { promises as fs } from "node:fs";
import path from "node:path";
import type { StorageKind } from "@/lib/types";

/**
 * Key-value JSON storage for accounts and saved audits.
 *
 *   blob — Vercel Blob, private store. Used whenever BLOB_READ_WRITE_TOKEN is set.
 *   fs   — a local directory (.data/ by default). Development and self-hosting.
 *   none — production with no store connected. Account features switch off and say so,
 *          rather than writing to an instance's /tmp and losing it on the next cold start.
 *
 * The audit never touches this module's failure paths: it works with storage "none".
 */

const KEY_RE = /^[a-z0-9][a-z0-9/_.-]{0,200}$/;

function assertKey(key: string): void {
  if (!KEY_RE.test(key) || key.includes("..") || key.includes("//")) {
    throw new Error(`Invalid storage key: ${key}`);
  }
}

export function storageKind(): StorageKind {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.CRAWLSPACE_STORAGE === "fs") return "fs";
  // On Vercel the filesystem is read-only apart from a per-instance /tmp, so without a
  // Blob store there is nowhere durable to put an account.
  if (process.env.VERCEL) return "none";
  return "fs";
}

export function storageEnabled(): boolean {
  return storageKind() !== "none";
}

function dataDir(): string {
  return process.env.CRAWLSPACE_DATA_DIR || path.join(process.cwd(), ".data");
}

// ── Blob backend ────────────────────────────────────────────────────────────
async function blobGet(key: string): Promise<string | null> {
  const { get } = await import("@vercel/blob");
  const res = await get(key, { access: "private", useCache: false });
  if (!res || !res.stream) return null;
  return new Response(res.stream).text();
}

async function blobPut(key: string, body: string): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(key, body, {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function blobDel(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const { del } = await import("@vercel/blob");
  await del(keys);
}

async function blobList(prefix: string): Promise<string[]> {
  const { list } = await import("@vercel/blob");
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

// ── Filesystem backend ──────────────────────────────────────────────────────
function fsPath(key: string): string {
  return path.join(dataDir(), ...key.split("/"));
}

async function fsGet(key: string): Promise<string | null> {
  try {
    return await fs.readFile(fsPath(key), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function fsPut(key: string, body: string): Promise<void> {
  const file = fsPath(key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  // Write then rename, so a crash never leaves half a JSON file behind.
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, body, "utf8");
  await fs.rename(tmp, file);
}

async function fsDel(keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => fs.rm(fsPath(k), { force: true })));
}

async function fsList(prefix: string): Promise<string[]> {
  const root = dataDir();
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (!e.name.endsWith(".tmp")) out.push(path.relative(root, full).split(path.sep).join("/"));
    }
  }
  await walk(root);
  return out.filter((k) => k.startsWith(prefix)).sort();
}

// ── Public API ──────────────────────────────────────────────────────────────
export class StorageDisabledError extends Error {
  constructor() {
    super("Accounts are not available on this deployment yet: no storage is connected.");
    this.name = "StorageDisabledError";
  }
}

function backend() {
  const kind = storageKind();
  if (kind === "blob") return { get: blobGet, put: blobPut, del: blobDel, list: blobList };
  if (kind === "fs") return { get: fsGet, put: fsPut, del: fsDel, list: fsList };
  throw new StorageDisabledError();
}

export async function getJSON<T>(key: string): Promise<T | null> {
  assertKey(key);
  const raw = await backend().get(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function putJSON(key: string, value: unknown): Promise<void> {
  assertKey(key);
  await backend().put(key, JSON.stringify(value));
}

export async function delKeys(keys: string[]): Promise<void> {
  keys.forEach(assertKey);
  await backend().del(keys);
}

export async function listKeys(prefix: string): Promise<string[]> {
  assertKey(prefix);
  return backend().list(prefix);
}
