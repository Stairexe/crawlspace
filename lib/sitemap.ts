import { guardedFetch, normaliseUrl, softFetch } from "./fetcher";

/**
 * Pick the pages a site survey will inspect. Reads Sitemap: lines from robots.txt (or
 * falls back to /sitemap.xml), follows one level of sitemap index, keeps same-host URLs
 * only, and samples across sections so twenty pages are not all blog posts.
 * Every fetch goes through the SSRF-guarded fetcher.
 */
export const SITE_PAGE_LIMIT = 20;

export interface SitePlan {
  origin: string;
  source: string;
  totalFound: number;
  urls: string[];
}

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
}

function sample(urls: string[], origin: string, limit: number): string[] {
  const byHost = urls.filter((u) => {
    try {
      return new URL(u).origin === origin;
    } catch {
      return false;
    }
  });
  const unique = [...new Set(byHost)];
  // Round-robin across first path segments, shortest paths first within each.
  const groups = new Map<string, string[]>();
  for (const u of unique.sort((a, b) => a.length - b.length)) {
    const seg = new URL(u).pathname.split("/").filter(Boolean)[0] ?? "";
    groups.set(seg, [...(groups.get(seg) ?? []), u]);
  }
  const out: string[] = [];
  const home = `${origin}/`;
  out.push(home);
  const lists = [...groups.values()];
  for (let i = 0; out.length < limit && lists.some((l) => l.length > i); i++) {
    for (const l of lists) {
      if (out.length >= limit) break;
      if (l[i] && !out.includes(l[i]) && l[i] !== origin) out.push(l[i]);
    }
  }
  return out.slice(0, limit);
}

export async function planSite(input: string): Promise<SitePlan> {
  const origin = normaliseUrl(input).origin;
  const robots = await softFetch(`${origin}/robots.txt`, { accept: "text/plain", timeoutMs: 6000, maxBytes: 256 * 1024 });
  const declared =
    robots && robots.status === 200
      ? [...robots.body.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1])
      : [];
  const candidates = declared.length ? declared.slice(0, 3) : [`${origin}/sitemap.xml`];

  let found: string[] = [];
  let source = "none";
  for (const sm of candidates) {
    const res = await softFetch(sm, { accept: "application/xml,text/xml", timeoutMs: 8000, maxBytes: 4 * 1024 * 1024 });
    if (!res || res.status !== 200) continue;
    source = sm;
    if (/<sitemapindex/i.test(res.body)) {
      for (const child of locs(res.body).slice(0, 3)) {
        const c = await softFetch(child, { accept: "application/xml,text/xml", timeoutMs: 8000, maxBytes: 4 * 1024 * 1024 });
        if (c && c.status === 200) found.push(...locs(c.body));
        if (found.length > 5000) break;
      }
    } else {
      found.push(...locs(res.body));
    }
    if (found.length) break;
  }

  if (!found.length) {
    // No sitemap: fall back to links on the homepage.
    const home = await guardedFetch(`${origin}/`, { timeoutMs: 8000 });
    found = [...home.body.matchAll(/href="([^"#?]+)"/gi)]
      .map((m) => {
        try {
          return new URL(m[1], origin).toString();
        } catch {
          return "";
        }
      })
      .filter((u) => u.startsWith(origin) && !/\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js|xml|ico)$/i.test(u));
    source = "homepage links (no sitemap found)";
  }

  return { origin, source, totalFound: new Set(found).size, urls: sample(found, origin, SITE_PAGE_LIMIT) };
}
