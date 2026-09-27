import { softFetch } from "./fetcher";
import type { EntityEvidence } from "./types";

/**
 * Is the organisation behind this domain a known entity?
 *
 * Wikidata is the open knowledge graph that Google's Knowledge Graph, Bing and the
 * assistants all draw on, and its "official website" property (P856) is the one link
 * from an entity to a domain that nobody but the entity's editors controls. So the
 * lookup is by domain, never by name: a name search for "Linear" returns linear algebra,
 * and a name match that cannot be tied to the domain proves nothing.
 *
 * Two requests at most, both through the guarded fetcher, both allowed to fail. A failed
 * lookup is reported as unchecked and the check scores it n/a — the site is never
 * marked down for Wikimedia being slow or rate-limiting us.
 */

const API = "https://www.wikidata.org/w/api.php";
const TIMEOUT_MS = 4000;
const MAX_BYTES = 256 * 1024;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map<string, { at: number; value: Omit<EntityEvidence, "sameAs" | "linkedFromPage"> }>();

/**
 * Shared hosting and publishing platforms. On these the domain's entity is the platform,
 * not the publisher, so a match would credit Medium for a stranger's post.
 */
const SHARED_PLATFORMS = new Set([
  "medium.com", "substack.com", "github.io", "gitlab.io", "vercel.app", "netlify.app",
  "pages.dev", "workers.dev", "wordpress.com", "blogspot.com", "wixsite.com", "notion.site",
  "webflow.io", "framer.website", "herokuapp.com", "gitbook.io", "tumblr.com", "ghost.io",
  "hashnode.dev", "dev.to", "squarespace.com", "carrd.co", "linktr.ee",
]);

/** Second-level suffixes where the registrable domain has three labels (co.uk, com.au…). */
const TWO_PART_SUFFIX = /\.(co|com|org|net|ac|gov|edu|ne|or)\.[a-z]{2}$/;

/** docs.stripe.com → stripe.com; www.bbc.co.uk → bbc.co.uk. An approximation, not the PSL. */
export function registrableDomain(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  const parts = h.split(".");
  const keep = TWO_PART_SUFFIX.test(h) ? 3 : 2;
  return parts.slice(-keep).join(".");
}

/** Every sameAs URL declared by any JSON-LD node on the page, de-duplicated. */
export function collectSameAs(jsonLd: { raw: unknown }[]): string[] {
  const out = new Set<string>();
  const visit = (node: unknown, depth: number) => {
    if (!node || typeof node !== "object" || depth > 6) return;
    if (Array.isArray(node)) {
      for (const n of node) visit(n, depth + 1);
      return;
    }
    const rec = node as Record<string, unknown>;
    const same = rec.sameAs;
    for (const s of Array.isArray(same) ? same : [same]) {
      if (typeof s === "string" && /^https?:\/\//i.test(s)) out.add(s.trim());
    }
    for (const [k, v] of Object.entries(rec)) if (k !== "sameAs") visit(v, depth + 1);
  };
  for (const n of jsonLd) visit(n.raw, 0);
  return [...out].slice(0, 40);
}

const WIKIDATA_ID = /wikidata\.org\/(?:wiki|entity)\/(Q\d+)/i;

function variants(domain: string): string[] {
  const out: string[] = [];
  for (const scheme of ["https", "http"]) {
    for (const host of [domain, `www.${domain}`]) {
      out.push(`P856=${scheme}://${host}/`, `P856=${scheme}://${host}`);
    }
  }
  return out;
}

async function getJson(params: Record<string, string>): Promise<unknown | null> {
  const qs = new URLSearchParams({ ...params, format: "json", origin: "*" });
  const res = await softFetch(`${API}?${qs}`, {
    accept: "application/json",
    timeoutMs: TIMEOUT_MS,
    maxBytes: MAX_BYTES,
  });
  if (!res || res.status !== 200) return null;
  try {
    return JSON.parse(res.body);
  } catch {
    return null;
  }
}

interface WbEntity {
  id?: string;
  missing?: string;
  labels?: { en?: { value?: string } };
  descriptions?: { en?: { value?: string } };
  sitelinks?: { enwiki?: { url?: string; title?: string } };
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export async function lookupEntity(pageUrl: string, sameAs: string[]): Promise<EntityEvidence> {
  const host = hostOf(pageUrl) ?? "";
  const domain = registrableDomain(host);
  const linkedIds = sameAs.map((s) => s.match(WIKIDATA_ID)?.[1]).filter((x): x is string => !!x);

  const finish = (base: Omit<EntityEvidence, "sameAs" | "linkedFromPage">): EntityEvidence => {
    const wd = base.wikidata;
    const linkedFromPage =
      !!wd &&
      sameAs.some(
        (s) =>
          s.match(WIKIDATA_ID)?.[1] === wd.id ||
          (!!base.wikipedia && decodeURIComponent(s).replace(/^http:/, "https:") === decodeURIComponent(base.wikipedia)),
      );
    return { ...base, sameAs, linkedFromPage };
  };

  const cached = cache.get(domain);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS && linkedIds.length === 0) return finish(cached.value);

  const unchecked = { checked: false, domain, platform: null, wikidata: null, wikipedia: null };
  if (SHARED_PLATFORMS.has(domain)) return finish({ ...unchecked, platform: domain });

  // 1. Which items name this domain as their official website?
  const search = (await getJson({
    action: "query",
    list: "search",
    srsearch: `haswbstatement:${variants(domain).join("|")}`,
    srlimit: "3",
    srnamespace: "0",
  })) as { query?: { search?: { title?: string }[] } } | null;
  if (!search?.query) return finish(unchecked);

  // The search already matched each hit's official-website claim against this domain,
  // so these ids are verified. A sameAs to an item that is not among them points at
  // someone else's entity (or an item without this website) and is not presence.
  const byDomain = (search.query.search ?? []).map((r) => r.title).filter((t): t is string => !!t && /^Q\d+$/.test(t));

  if (byDomain.length === 0) {
    const value = { checked: true, domain, platform: null, wikidata: null, wikipedia: null };
    cache.set(domain, { at: Date.now(), value });
    return finish(value);
  }

  // 2. Labels, descriptions and the English Wikipedia article. No claims: a large
  // organisation's item runs to half a megabyte with them.
  const got = (await getJson({
    action: "wbgetentities",
    ids: byDomain.join("|"),
    props: "labels|descriptions|sitelinks/urls",
    languages: "en",
    sitefilter: "enwiki",
  })) as { entities?: Record<string, WbEntity> } | null;
  if (!got?.entities) return finish(unchecked);

  const items = byDomain.map((id) => got.entities![id]).filter((e): e is WbEntity => !!e && !e.missing);
  // Prefer the item the page itself links, then one with a Wikipedia article, then search order.
  const match =
    items.find((e) => linkedIds.includes(e.id ?? "")) ?? items.find((e) => e.sitelinks?.enwiki?.url) ?? items[0];

  const value = match
    ? {
        checked: true,
        domain,
        platform: null,
        wikidata: {
          id: match.id!,
          label: match.labels?.en?.value ?? null,
          description: match.descriptions?.en?.value ?? null,
          url: `https://www.wikidata.org/wiki/${match.id}`,
        },
        wikipedia: match.sitelinks?.enwiki?.url ?? null,
      }
    : { checked: true, domain, platform: null, wikidata: null, wikipedia: null };
  cache.set(domain, { at: Date.now(), value });
  return finish(value);
}
