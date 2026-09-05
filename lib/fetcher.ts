import dns from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

/** The user agent we present. Honest about what we are — we are not spoofing a real crawler. */
export const CRAWLSPACE_UA =
  "Mozilla/5.0 (compatible; CrawlspaceBot/1.0; +https://github.com/Stairexe/crawlspace) GEO-audit";

export class FetchGuardError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "FetchGuardError";
  }
}

/**
 * True when an IP literal sits in a private, loopback, link-local or otherwise
 * reserved range. Checked after DNS resolution and again after every redirect —
 * see docs/ARCHITECTURE.md §5. Never weaken this.
 */
export function isBlockedAddress(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) {
    const p = ip.split(".").map(Number);
    if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
    const [a, b] = p as [number, number, number, number];
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 0) return true; // "this network"
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 192 && b === 0) return true; // 192.0.0.0/24, 192.0.2.0/24
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    if (a >= 224) return true; // multicast + reserved
    return false;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local
    if (lower.startsWith("ff")) return true; // multicast
    // IPv4-mapped: ::ffff:10.0.0.1
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedAddress(mapped[1]);
    return false;
  }
  return true; // not an IP at all — refuse
}

async function assertPublicHost(hostname: string): Promise<void> {
  const bare = hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(bare)) {
    if (isBlockedAddress(bare)) {
      throw new FetchGuardError(
        "That address is on a private network, so it cannot be audited.",
        "BLOCKED_ADDRESS",
      );
    }
    return;
  }
  const lower = bare.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost") || lower.endsWith(".internal") || lower.endsWith(".local")) {
    throw new FetchGuardError(
      "Local hostnames cannot be audited.",
      "BLOCKED_ADDRESS",
    );
  }
  let records: { address: string }[];
  try {
    records = await dns.lookup(bare, { all: true, verbatim: true });
  } catch {
    throw new FetchGuardError(
      `Could not resolve ${bare}. Check the domain and try again.`,
      "DNS_FAILED",
    );
  }
  if (records.length === 0) {
    throw new FetchGuardError(`Could not resolve ${bare}.`, "DNS_FAILED");
  }
  for (const r of records) {
    if (isBlockedAddress(r.address)) {
      throw new FetchGuardError(
        "That host resolves to a private address, so it cannot be audited.",
        "BLOCKED_ADDRESS",
      );
    }
  }
}

export function normaliseUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) throw new FetchGuardError("Enter a URL to audit.", "EMPTY_URL");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new FetchGuardError(`"${input}" is not a valid URL.`, "INVALID_URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchGuardError("Only http and https URLs can be audited.", "BAD_SCHEME");
  }
  if (!url.hostname.includes(".") && net.isIP(url.hostname) === 0) {
    throw new FetchGuardError(`"${input}" is not a valid public domain.`, "INVALID_URL");
  }
  url.hash = "";
  return url;
}

export interface GuardedResponse {
  body: string;
  status: number;
  finalUrl: string;
  headers: Headers;
  bytes: number;
  truncated: boolean;
  ms: number;
}

/**
 * Fetch a third-party URL safely: scheme allowlist, post-DNS private-range rejection,
 * manual redirect handling with re-validation, hard timeout and a byte cap.
 */
export async function guardedFetch(
  rawUrl: string | URL,
  opts: { accept?: string; timeoutMs?: number; maxBytes?: number } = {},
): Promise<GuardedResponse> {
  const started = Date.now();
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  const maxBytes = opts.maxBytes ?? MAX_BYTES;

  let current = rawUrl instanceof URL ? rawUrl : normaliseUrl(rawUrl);
  let redirects = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await assertPublicHost(current.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(current.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": CRAWLSPACE_UA,
          Accept: opts.accept ?? "text/html,application/xhtml+xml",
          "Accept-Language": "en",
        },
      });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        throw new FetchGuardError(
          `${current.hostname} did not respond within ${Math.round(timeoutMs / 1000)}s.`,
          "TIMEOUT",
        );
      }
      throw new FetchGuardError(
        `Could not reach ${current.hostname}.`,
        "UNREACHABLE",
      );
    }
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) {
        return {
          body: "",
          status: res.status,
          finalUrl: current.toString(),
          headers: res.headers,
          bytes: 0,
          truncated: false,
          ms: Date.now() - started,
        };
      }
      if (++redirects > MAX_REDIRECTS) {
        throw new FetchGuardError("Too many redirects.", "TOO_MANY_REDIRECTS");
      }
      current = new URL(location, current);
      if (current.protocol !== "http:" && current.protocol !== "https:") {
        throw new FetchGuardError("Redirected to a non-http scheme.", "BAD_SCHEME");
      }
      continue;
    }

    // Read with a byte cap so a huge document cannot exhaust the function.
    const reader = res.body?.getReader();
    let bytes = 0;
    let truncated = false;
    const chunks: Uint8Array[] = [];
    if (reader) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          bytes += value.byteLength;
          if (bytes > maxBytes) {
            chunks.push(value.slice(0, Math.max(0, value.byteLength - (bytes - maxBytes))));
            truncated = true;
            try {
              await reader.cancel();
            } catch {
              /* stream already closed */
            }
            break;
          }
          chunks.push(value);
        }
      }
    }
    const merged = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    const body = new TextDecoder("utf-8", { fatal: false }).decode(merged);

    return {
      body,
      status: res.status,
      finalUrl: current.toString(),
      headers: res.headers,
      bytes: Math.min(bytes, maxBytes),
      truncated,
      ms: Date.now() - started,
    };
  }
}

/** Fetch that resolves to null instead of throwing — used for the optional root files. */
export async function softFetch(
  url: string,
  opts?: Parameters<typeof guardedFetch>[1],
): Promise<GuardedResponse | null> {
  try {
    return await guardedFetch(url, opts);
  } catch {
    return null;
  }
}
