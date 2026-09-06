import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { ContentBlock, Evidence, BlockKind } from "./types";
import { countWords, scoreBlockText } from "./blocks";
import { guardedFetch, softFetch, normaliseUrl } from "./fetcher";
import { resolveAllAgents, explainRobotsFile } from "./robots";

const MIN_BLOCK_WORDS = 12;
const MAX_BLOCKS = 120;

const BOILERPLATE_SELECTORS = [
  "nav", "header", "footer", "aside", "script", "style", "noscript",
  "form", "svg", "iframe", "template",
  "[role=navigation]", "[role=banner]", "[role=contentinfo]",
  ".nav", ".navbar", ".menu", ".footer", ".header", ".sidebar",
  ".cookie", ".cookies", ".consent", ".breadcrumb", ".breadcrumbs",
  ".newsletter", ".subscribe", ".social", ".share", ".related",
  ".advertisement", ".ad", "#comments", ".comments",
].join(",");

function textOf($: cheerio.CheerioAPI, el: AnyNode): string {
  return $(el).text().replace(/\s+/g, " ").trim();
}

function domPath($: cheerio.CheerioAPI, el: AnyNode): string {
  const parts: string[] = [];
  let node = $(el);
  for (let i = 0; i < 4 && node.length; i++) {
    const tag = (node.get(0) as { tagName?: string } | undefined)?.tagName;
    if (!tag) break;
    const id = node.attr("id");
    if (id) {
      parts.unshift(`${tag}#${id}`);
      break;
    }
    const cls = (node.attr("class") ?? "").split(/\s+/).filter(Boolean)[0];
    parts.unshift(cls ? `${tag}.${cls}` : tag);
    node = node.parent();
  }
  return parts.join(" > ");
}

function pickRoot($: cheerio.CheerioAPI): cheerio.Cheerio<AnyNode> {
  for (const sel of ["main", "article", "[role=main]", "#content", ".content", ".post", ".entry-content"]) {
    const found = $(sel).first();
    if (found.length && countWords(found.text()) > 120) return found as cheerio.Cheerio<AnyNode>;
  }
  return $("body") as cheerio.Cheerio<AnyNode>;
}

function nearestHeading($: cheerio.CheerioAPI, el: AnyNode): string | undefined {
  const h = $(el).prevAll("h1,h2,h3,h4").first();
  if (h.length) return textOf($, h.get(0)!).slice(0, 160);
  const parentH = $(el).parent().prevAll("h1,h2,h3,h4").first();
  if (parentH.length) return textOf($, parentH.get(0)!).slice(0, 160);
  return undefined;
}

function extractBlocks($: cheerio.CheerioAPI): ContentBlock[] {
  const root = pickRoot($);
  const clone = root.clone();
  clone.find(BOILERPLATE_SELECTORS).remove();

  const blocks: ContentBlock[] = [];
  const seen = new Set<string>();
  let n = 0;

  const push = (text: string, kind: BlockKind, el: AnyNode) => {
    if (blocks.length >= MAX_BLOCKS) return;
    const clean = text.replace(/\s+/g, " ").trim();
    const wordCount = countWords(clean);
    if (wordCount < MIN_BLOCK_WORDS) return;
    const key = clean.slice(0, 80).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const { scores, notes } = scoreBlockText(clean, kind);
    blocks.push({
      id: `b${++n}`,
      kind,
      heading: nearestHeading($, el),
      text: clean.length > 1600 ? clean.slice(0, 1600) + "…" : clean,
      words: wordCount,
      domPath: domPath($, el),
      scores,
      notes,
    });
  };

  clone.find("p").each((_, el) => push(textOf($, el), "paragraph", el));

  clone.find("ul,ol").each((_, el) => {
    const items = $(el)
      .children("li")
      .map((__, li) => textOf($, li))
      .get()
      .filter(Boolean);
    if (items.length >= 2) push(items.join(". "), "list", el);
  });

  clone.find("table").each((_, el) => {
    const t = textOf($, el);
    if (t) push(t, "table", el);
  });

  clone.find("dl").each((_, el) => {
    const t = textOf($, el);
    if (t) push(t, "faq", el);
  });

  return blocks.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
}

function collectJsonLd($: cheerio.CheerioAPI): { types: string[]; raw: unknown }[] {
  const out: { types: string[]; raw: unknown }[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        const graph =
          node && typeof node === "object" && "@graph" in node
            ? ((node as { "@graph": unknown[] })["@graph"] ?? [])
            : [node];
        for (const g of graph) {
          const t = (g as { "@type"?: string | string[] })?.["@type"];
          const types = Array.isArray(t) ? t : t ? [t] : [];
          out.push({ types: types.map(String), raw: g });
        }
      }
    } catch {
      out.push({ types: ["INVALID_JSON"], raw: raw.slice(0, 200) });
    }
  });
  return out;
}

function validateLlmsTxt(raw: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const lines = raw.split(/\r?\n/);
  if (!lines.some((l) => /^#\s+\S/.test(l))) {
    issues.push("No H1 title line (llms.txt should open with `# Site name`).");
  }
  if (!/\[[^\]]+\]\([^)]+\)/.test(raw)) {
    issues.push("No markdown links — llms.txt is meant to point at your key pages.");
  }
  if (raw.trim().length < 80) issues.push("Too short to give an assistant useful context.");
  if (/<html|<body|<!doctype/i.test(raw)) {
    issues.push("Served HTML rather than plain text — the file is not being served correctly.");
  }
  return { valid: issues.length === 0, issues };
}

function detectFramework(html: string): string | null {
  if (/__NEXT_DATA__|\/_next\//.test(html)) return "Next.js";
  if (/data-reactroot|react-dom/.test(html)) return "React";
  if (/ng-version|angular/i.test(html)) return "Angular";
  if (/data-v-app|__NUXT__/.test(html)) return "Vue / Nuxt";
  if (/wp-content|wp-includes/.test(html)) return "WordPress";
  if (/cdn\.shopify\.com/.test(html)) return "Shopify";
  if (/webflow/i.test(html)) return "Webflow";
  if (/squarespace/i.test(html)) return "Squarespace";
  return null;
}

export async function gatherEvidence(inputUrl: string): Promise<Evidence> {
  const started = Date.now();
  const url = normaliseUrl(inputUrl);
  const page = await guardedFetch(url);

  const finalUrl = new URL(page.finalUrl);
  const origin = finalUrl.origin;
  const path = finalUrl.pathname || "/";

  const [robotsRes, llmsRes, sitemapRes] = await Promise.all([
    softFetch(`${origin}/robots.txt`, { accept: "text/plain", timeoutMs: 6000, maxBytes: 256 * 1024 }),
    softFetch(`${origin}/llms.txt`, { accept: "text/plain", timeoutMs: 6000, maxBytes: 256 * 1024 }),
    softFetch(`${origin}/sitemap.xml`, { accept: "application/xml", timeoutMs: 6000, maxBytes: 256 * 1024 }),
  ]);

  const robotsRaw =
    robotsRes && robotsRes.status === 200 && !/<html/i.test(robotsRes.body.slice(0, 200))
      ? robotsRes.body
      : null;

  const llmsFound =
    !!llmsRes && llmsRes.status === 200 && llmsRes.body.trim().length > 0 &&
    !/<html/i.test(llmsRes.body.slice(0, 200));
  const llmsCheck = llmsFound ? validateLlmsTxt(llmsRes!.body) : { valid: false, issues: [] };

  const $ = cheerio.load(page.body);
  const bodyText = (() => {
    const c = $("body").clone();
    c.find("script,style,noscript,template").remove();
    return c.text().replace(/\s+/g, " ").trim();
  })();

  const headings = $("h1,h2,h3,h4,h5,h6")
    .map((_, el) => ({
      level: Number((el as { tagName: string }).tagName.slice(1)),
      text: textOf($, el).slice(0, 200),
    }))
    .get()
    .filter((h) => h.text.length > 0)
    .slice(0, 80);

  const blocks = extractBlocks($);
  const jsonLd = collectJsonLd($);

  let internal = 0;
  let external = 0;
  const citationDomains = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const abs = new URL(href, finalUrl);
      if (abs.hostname === finalUrl.hostname) internal++;
      else {
        external++;
        if (!/facebook|twitter|x\.com|instagram|linkedin|youtube|tiktok|pinterest/.test(abs.hostname)) {
          citationDomains.add(abs.hostname.replace(/^www\./, ""));
        }
      }
    } catch {
      /* malformed href */
    }
  });

  const images = $("img").length;
  const withAlt = $("img[alt]").filter((_, el) => ($(el).attr("alt") ?? "").trim().length > 0).length;

  const authorSchema = jsonLd.find((n) => {
    const r = n.raw as { author?: unknown };
    return !!r?.author;
  });
  const authorName =
    $('[rel="author"]').first().text().trim() ||
    $('[itemprop="author"]').first().text().trim() ||
    $('meta[name="author"]').attr("content") ||
    (() => {
      const r = authorSchema?.raw as { author?: { name?: string } | { name?: string }[] } | undefined;
      const a = Array.isArray(r?.author) ? r?.author[0] : r?.author;
      return a?.name;
    })() ||
    null;

  const modified =
    $('meta[property="article:modified_time"]').attr("content") ||
    (jsonLd.find((n) => (n.raw as { dateModified?: string })?.dateModified)?.raw as { dateModified?: string })?.dateModified ||
    null;
  const published =
    $('meta[property="article:published_time"]').attr("content") ||
    (jsonLd.find((n) => (n.raw as { datePublished?: string })?.datePublished)?.raw as { datePublished?: string })?.datePublished ||
    $("time[datetime]").first().attr("datetime") ||
    null;
  const visibleDate =
    bodyText.match(
      /\b(?:last\s+)?(?:updated|reviewed|published|revised)(?:\s+on)?[:\s]+([A-Z][a-z]+ \d{1,2},? \d{4}|\d{1,2} [A-Z][a-z]+ \d{4}|\d{4}-\d{2}-\d{2})/i,
    )?.[0] ?? null;

  const h1Count = $("h1").length;
  let hierarchyOk = h1Count === 1;
  let prev = 0;
  for (const h of headings) {
    if (prev && h.level > prev + 1) hierarchyOk = false;
    prev = h.level;
  }

  const questionHeadings = headings.filter(
    (h) => /\?$/.test(h.text) || /^(what|how|why|when|where|who|which|is|are|can|should|does|do)\b/i.test(h.text),
  ).length;

  const faqPairs = (() => {
    const fromSchema = jsonLd.filter((n) => n.types.some((t) => /FAQPage|Question/i.test(t))).length;
    const fromDom = $("details summary").length + $("dl dt").length;
    return fromSchema * 3 + fromDom;
  })();

  const textWords = countWords(bodyText);

  const openGraph = {
    title: $('meta[property="og:title"]').attr("content")?.trim() ?? null,
    description: $('meta[property="og:description"]').attr("content")?.trim() ?? null,
    image: $('meta[property="og:image"]').attr("content")?.trim() ?? null,
    type: $('meta[property="og:type"]').attr("content")?.trim() ?? null,
    siteName: $('meta[property="og:site_name"]').attr("content")?.trim() ?? null,
  };

  const twitter = {
    card: $('meta[name="twitter:card"]').attr("content")?.trim() ?? null,
    title: $('meta[name="twitter:title"]').attr("content")?.trim() ?? null,
    description: $('meta[name="twitter:description"]').attr("content")?.trim() ?? null,
    image: $('meta[name="twitter:image"]').attr("content")?.trim() ?? null,
  };

  const viewport = $('meta[name="viewport"]').attr("content")?.trim() ?? null;
  const charset =
    $('meta[charset]').attr("charset") ??
    $('meta[http-equiv="Content-Type"]').attr("content") ??
    null;

  const detectedTypes = Array.from(new Set(jsonLd.flatMap((n) => n.types)));
  const schemaIssues: string[] = [];
  const rawSnippets: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (raw) rawSnippets.push(raw);
  });

  const orgNode = jsonLd.find((n) => n.types.includes("Organization"))?.raw as Record<string, unknown> | undefined;
  if (orgNode) {
    if (!orgNode.sameAs || (Array.isArray(orgNode.sameAs) && orgNode.sameAs.length === 0)) {
      schemaIssues.push("Organization schema is missing sameAs social/entity profiles.");
    }
    if (!orgNode.logo) {
      schemaIssues.push("Organization schema is missing brand logo URL.");
    }
  } else if (!detectedTypes.some((t) => /Organization|Corporation/i.test(t))) {
    schemaIssues.push("No Organization schema detected — recommended for brand authority.");
  }

  const pageNode = jsonLd.find((n) => n.types.some((t) => /WebPage|Article|BlogPosting/i.test(t)))?.raw as Record<string, unknown> | undefined;
  if (pageNode) {
    if (!pageNode.dateModified && !pageNode.datePublished) {
      schemaIssues.push("Page schema lacks dateModified and datePublished timestamps.");
    }
    if (!pageNode.author) {
      schemaIssues.push("Page schema is missing an author entity.");
    }
  }

  const sitemapUrlCount =
    sitemapRes && sitemapRes.status === 200
      ? (sitemapRes.body.match(/<loc>/gi) ?? []).length
      : undefined;

  return {
    url: url.toString(),
    finalUrl: page.finalUrl,
    status: page.status,
    fetchedAt: new Date().toISOString(),
    timings: { totalMs: Date.now() - started, fetchMs: page.ms },
    html: {
      title: $("title").first().text().trim() || null,
      metaDescription: $('meta[name="description"]').attr("content")?.trim() ?? null,
      canonical: $('link[rel="canonical"]').attr("href") ?? null,
      lang: $("html").attr("lang") ?? null,
      viewport,
      charset,
      htmlBytes: page.bytes,
      textWords,
      textBytes: Buffer.byteLength(bodyText, "utf8"),
      textToHtmlRatio: page.bytes > 0 ? Math.round((Buffer.byteLength(bodyText, "utf8") / page.bytes) * 1000) / 1000 : 0,
    },
    openGraph,
    twitter,
    headings,
    blocks,
    jsonLd,
    microdata: $("[itemtype]")
      .map((_, el) => ($(el).attr("itemtype") ?? "").split("/").pop() ?? "")
      .get()
      .filter(Boolean)
      .slice(0, 20),
    schemaAnalysis: {
      detectedTypes,
      issues: schemaIssues,
      rawSnippets,
    },
    robots: {
      found: robotsRaw !== null,
      status: robotsRes?.status ?? null,
      rules: resolveAllAgents(robotsRaw, path),
      metaRobots: $('meta[name="robots"]').attr("content") ?? null,
      xRobotsTag: page.headers.get("x-robots-tag"),
      rawText: robotsRaw,
      explainedRules: explainRobotsFile(robotsRaw),
    },
    llmsTxt: {
      found: llmsFound,
      valid: llmsCheck.valid,
      issues: llmsCheck.issues,
      bytes: llmsFound ? llmsRes!.bytes : 0,
    },
    sitemap: {
      found: !!sitemapRes && sitemapRes.status === 200 && /<urlset|<sitemapindex/i.test(sitemapRes.body.slice(0, 500)),
      inRobots: robotsRaw !== null && /sitemap:/i.test(robotsRaw),
      urlCount: sitemapUrlCount,
    },
    links: {
      internal,
      external,
      externalCitations: citationDomains.size,
      citationDomains: [...citationDomains].slice(0, 12),
    },
    media: { images, withAlt },
    dates: { published, modified, visibleDate },
    author: {
      name: authorName ? authorName.slice(0, 80) : null,
      hasSchema: !!authorSchema,
      hasBio: $('.author-bio, .bio, [class*="author"]').text().trim().length > 80,
    },
    semantics: {
      main: $("main").length > 0,
      article: $("article").length > 0,
      nav: $("nav").length > 0,
      header: $("header").length > 0,
      footer: $("footer").length > 0,
      h1Count,
      hierarchyOk,
    },
    signals: {
      stats: (bodyText.match(/\b\d[\d,.]*\b/g) ?? []).length,
      percentages: (bodyText.match(/\d+(\.\d+)?\s?%/g) ?? []).length,
      years: (bodyText.match(/\b(19|20)\d{2}\b/g) ?? []).length,
      quotes: $("blockquote,q").length + (bodyText.match(/[“"][^”"]{40,}[”"]/g) ?? []).length,
      tables: $("table").length,
      lists: $("ul,ol").length,
      faqPairs,
      questionHeadings,
    },
    renderedWithoutJs: textWords >= 200,
    frameworkHint: detectFramework(page.body),
  };
}
