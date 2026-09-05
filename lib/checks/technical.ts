import type { CheckResult, Evidence } from "../types";

const SCHEMA_OF_INTEREST = [
  "Article", "BlogPosting", "NewsArticle", "FAQPage", "HowTo", "Product",
  "Organization", "WebSite", "WebPage", "BreadcrumbList", "Person",
  "Review", "AggregateRating", "ItemList", "SoftwareApplication", "Service",
];

/** Machine readability (14) + authority (12) + retrievability (10). */
export function technicalChecks(e: Evidence): CheckResult[] {
  const checks: CheckResult[] = [];
  const types = new Set(e.jsonLd.flatMap((n) => n.types));
  const relevant = SCHEMA_OF_INTEREST.filter((t) => types.has(t));
  const invalid = e.jsonLd.some((n) => n.types.includes("INVALID_JSON"));

  // ---- Machine readability --------------------------------------------------
  checks.push({
    id: "jsonld-present",
    category: "machine-readability",
    label: "Structured data (JSON-LD)",
    status: invalid ? "fail" : relevant.length >= 2 ? "pass" : relevant.length === 1 ? "warn" : "fail",
    value: invalid ? 0 : Math.min(1, relevant.length / 3),
    weight: 8,
    engines: ["google-aio", "perplexity", "copilot"],
    evidence: invalid
      ? "A JSON-LD block on the page is malformed and will be ignored by every parser."
      : relevant.length
        ? `Found: ${relevant.join(", ")}.`
        : "No JSON-LD structured data found.",
    fix:
      invalid || relevant.length < 2
        ? {
            summary: "Add Organization, WebPage and content-type schema",
            detail:
              "Structured data is how a machine knows what this page is before it reads a word of it. Organization for the entity, " +
              "Article or Product for the content type, FAQPage if there are questions. Google calls it not-required for AI Overviews " +
              "but recommends it for Search overall; Perplexity and Copilot reward it directly.",
            effort: "small",
            generates: "jsonld",
          }
        : undefined,
  });

  checks.push({
    id: "llms-txt",
    category: "machine-readability",
    label: "llms.txt",
    status: e.llmsTxt.found && e.llmsTxt.valid ? "pass" : e.llmsTxt.found ? "warn" : "fail",
    value: e.llmsTxt.found ? (e.llmsTxt.valid ? 1 : 0.5) : 0,
    weight: 4,
    // Deliberately NOT flagged for Google — their guidance says AI files are not required.
    engines: ["chatgpt", "perplexity", "claude"],
    evidence: e.llmsTxt.found
      ? e.llmsTxt.valid
        ? `Valid llms.txt served (${e.llmsTxt.bytes} bytes).`
        : `llms.txt found but has issues: ${e.llmsTxt.issues.join(" ")}`
      : "No /llms.txt at the site root.",
    fix: !e.llmsTxt.found || !e.llmsTxt.valid
      ? {
          summary: "Publish an llms.txt at the site root",
          detail:
            "A short markdown file telling an assistant what this site is, who it serves, and where the key pages are. " +
            "Google states it is not required for AI Overviews — this is scored for ChatGPT, Claude and Perplexity only, " +
            "and it is a ten-minute job.",
          effort: "trivial",
          generates: "llms.txt",
        }
      : undefined,
  });

  const semanticScore =
    (e.semantics.main ? 0.4 : 0) +
    (e.semantics.article ? 0.2 : 0) +
    (e.semantics.nav ? 0.15 : 0) +
    (e.semantics.header ? 0.125 : 0) +
    (e.semantics.footer ? 0.125 : 0);
  checks.push({
    id: "semantic-html",
    category: "machine-readability",
    label: "Semantic HTML landmarks",
    status: semanticScore >= 0.6 ? "pass" : semanticScore >= 0.3 ? "warn" : "fail",
    value: semanticScore,
    weight: 5,
    evidence: `Present: ${[
      e.semantics.main && "main",
      e.semantics.article && "article",
      e.semantics.nav && "nav",
      e.semantics.header && "header",
      e.semantics.footer && "footer",
    ]
      .filter(Boolean)
      .join(", ") || "none"}.`,
    fix:
      semanticScore < 0.6
        ? {
            summary: "Wrap the page body in <main>",
            detail:
              "Agents that read the accessibility tree use landmarks to find the content and skip the chrome. " +
              "Without <main>, navigation and footer text get mixed into whatever gets extracted.",
            effort: "trivial",
          }
        : undefined,
  });

  checks.push({
    id: "sitemap",
    category: "machine-readability",
    label: "Sitemap",
    status: e.sitemap.found ? "pass" : "warn",
    value: e.sitemap.found ? (e.sitemap.inRobots ? 1 : 0.8) : 0,
    weight: 2,
    evidence: e.sitemap.found
      ? e.sitemap.inRobots
        ? "sitemap.xml found and declared in robots.txt."
        : "sitemap.xml found but not declared in robots.txt."
      : "No sitemap.xml at the site root.",
    fix: !e.sitemap.found || !e.sitemap.inRobots
      ? {
          summary: "Publish a sitemap and declare it in robots.txt",
          detail: "Add `Sitemap: https://yoursite.com/sitemap.xml` to robots.txt so every crawler finds it on first fetch.",
          effort: "trivial",
        }
      : undefined,
  });

  checks.push({
    id: "alt-text",
    category: "machine-readability",
    label: "Image alt text",
    status:
      e.media.images === 0
        ? "na"
        : e.media.withAlt / e.media.images >= 0.9
          ? "pass"
          : e.media.withAlt / e.media.images >= 0.6
            ? "warn"
            : "fail",
    value: e.media.images === 0 ? 1 : e.media.withAlt / e.media.images,
    weight: 2,
    evidence:
      e.media.images === 0
        ? "No images on the page."
        : `${e.media.withAlt} of ${e.media.images} images have non-empty alt text.`,
    fix:
      e.media.images > 0 && e.media.withAlt / e.media.images < 0.9
        ? {
            summary: "Describe the images in alt text",
            detail:
              "Alt text is the only version of an image an assistant reads, and it is part of the accessibility tree agents navigate by.",
            effort: "small",
          }
        : undefined,
  });

  // ---- Authority ------------------------------------------------------------
  checks.push({
    id: "named-author",
    category: "authority",
    label: "Named author",
    status: e.author.name ? (e.author.hasSchema ? "pass" : "warn") : "fail",
    value: e.author.name ? (e.author.hasSchema ? 1 : 0.6) : 0,
    weight: 6,
    engines: ["google-aio", "chatgpt", "claude"],
    evidence: e.author.name
      ? `Author "${e.author.name}"${e.author.hasSchema ? " with author schema" : " but no author schema"}.`
      : "No author named anywhere on the page.",
    fix: !e.author.name || !e.author.hasSchema
      ? {
          summary: "Name the author and mark them up",
          detail:
            "E-E-A-T is weighted heavily by Google's AI features, and an unattributed page has no expertise signal at all. " +
            "Add a byline, a two-line bio with relevant credentials, and Person schema linked from the Article schema.",
          effort: "small",
          generates: "jsonld",
        }
      : undefined,
  });

  const hasDate = !!(e.dates.modified || e.dates.published || e.dates.visibleDate);
  const fresh = (() => {
    const iso = e.dates.modified ?? e.dates.published;
    if (!iso) return null;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return null;
    return (Date.now() - t) / (1000 * 60 * 60 * 24);
  })();
  checks.push({
    id: "freshness",
    category: "authority",
    label: "Freshness signal",
    status: !hasDate ? "fail" : fresh !== null && fresh <= 180 ? "pass" : "warn",
    value: !hasDate ? 0 : fresh === null ? 0.6 : fresh <= 30 ? 1 : fresh <= 180 ? 0.8 : fresh <= 365 ? 0.5 : 0.25,
    weight: 6,
    engines: ["chatgpt", "perplexity"],
    evidence: hasDate
      ? `${e.dates.modified ? `dateModified ${e.dates.modified}` : e.dates.published ? `datePublished ${e.dates.published}` : e.dates.visibleDate}` +
        (fresh !== null ? ` — ${Math.round(fresh)} days old.` : "")
      : "No published or modified date in the markup or the visible copy.",
    fix: !hasDate || (fresh !== null && fresh > 180)
      ? {
          summary: "Show a real last-updated date and keep it true",
          detail:
            "Content updated within 30 days is cited roughly 3.2x more often by ChatGPT. Put a visible 'Last updated' line on the page " +
            "and a dateModified in the Article schema — and only change it when the content actually changed.",
          effort: "trivial",
        }
      : undefined,
  });

  checks.push({
    id: "organization-entity",
    category: "authority",
    label: "Organisation entity defined",
    status: types.has("Organization") ? "pass" : "fail",
    value: types.has("Organization") ? 1 : 0,
    weight: 4,
    evidence: types.has("Organization")
      ? "Organization schema present."
      : "No Organization schema — nothing tells a machine who publishes this.",
    fix: !types.has("Organization")
      ? {
          summary: "Add Organization schema with sameAs links",
          detail:
            "Entity recognition is what lets an assistant connect this page to your brand elsewhere on the web. " +
            "Include name, url, logo and sameAs pointing at your LinkedIn, GitHub and any Wikipedia or Crunchbase entry.",
          effort: "trivial",
          generates: "jsonld",
        }
      : undefined,
  });

  // ---- Retrievability -------------------------------------------------------
  const titleLen = e.html.title?.length ?? 0;
  checks.push({
    id: "title-tag",
    category: "retrievability",
    label: "Title tag",
    status: titleLen >= 15 && titleLen <= 65 ? "pass" : titleLen > 0 ? "warn" : "fail",
    value: titleLen === 0 ? 0 : titleLen >= 15 && titleLen <= 65 ? 1 : 0.6,
    weight: 3,
    evidence: e.html.title ? `"${e.html.title}" (${titleLen} chars)` : "No title tag.",
    fix:
      titleLen === 0 || titleLen > 65 || titleLen < 15
        ? {
            summary: "Write a 15–65 character descriptive title",
            detail: "The title is the strongest single hint about what question this page answers.",
            effort: "trivial",
          }
        : undefined,
  });

  const descLen = e.html.metaDescription?.length ?? 0;
  checks.push({
    id: "meta-description",
    category: "retrievability",
    label: "Meta description",
    status: descLen >= 70 && descLen <= 165 ? "pass" : descLen > 0 ? "warn" : "fail",
    value: descLen === 0 ? 0 : descLen >= 70 && descLen <= 165 ? 1 : 0.6,
    weight: 2,
    evidence: e.html.metaDescription ? `${descLen} characters.` : "No meta description.",
    fix:
      descLen < 70 || descLen > 165
        ? {
            summary: "Write a 70–165 character description that answers the query",
            detail: "Treat it as the 40-word answer block in miniature: state what the page tells you, not what it is about.",
            effort: "trivial",
          }
        : undefined,
  });

  checks.push({
    id: "canonical",
    category: "retrievability",
    label: "Canonical URL",
    status: e.html.canonical ? "pass" : "warn",
    value: e.html.canonical ? 1 : 0.4,
    weight: 2,
    evidence: e.html.canonical ? e.html.canonical : "No canonical link element.",
    fix: !e.html.canonical
      ? {
          summary: "Declare a canonical URL",
          detail: "Without one, duplicate paths split whatever authority the page has earned.",
          effort: "trivial",
        }
      : undefined,
  });

  checks.push({
    id: "content-weight",
    category: "retrievability",
    label: "Content-to-markup ratio",
    status: e.html.textToHtmlRatio >= 0.12 ? "pass" : e.html.textToHtmlRatio >= 0.05 ? "warn" : "fail",
    value: Math.min(1, e.html.textToHtmlRatio / 0.15),
    weight: 3,
    engines: ["copilot"],
    evidence: `${e.html.textWords} words of text in ${Math.round(e.html.htmlBytes / 1024)}KB of HTML (ratio ${e.html.textToHtmlRatio}).`,
    fix:
      e.html.textToHtmlRatio < 0.12
        ? {
            summary: "Reduce the markup weight around the content",
            detail:
              "A heavy document costs crawl budget and slows the page. Copilot in particular has a clear sub-2s page-speed threshold.",
            effort: "medium",
          }
        : undefined,
  });

  checks.push({
    id: "internal-links",
    category: "retrievability",
    label: "Internal linking",
    status: e.links.internal >= 8 ? "pass" : e.links.internal >= 3 ? "warn" : "fail",
    value: Math.min(1, e.links.internal / 10),
    weight: 2,
    evidence: `${e.links.internal} internal links, ${e.links.external} external.`,
    fix:
      e.links.internal < 8
        ? {
            summary: "Link this page into its topic cluster",
            detail:
              "Google's AI features fan a query out into related sub-queries and retrieve across the cluster. " +
              "An orphaned page is only retrievable for its own exact topic.",
            effort: "small",
          }
        : undefined,
  });

  checks.push({
    id: "lang-declared",
    category: "retrievability",
    label: "Language declared",
    status: e.html.lang ? "pass" : "warn",
    value: e.html.lang ? 1 : 0.5,
    weight: 1,
    evidence: e.html.lang ? `<html lang="${e.html.lang}">` : "No lang attribute on <html>.",
    fix: !e.html.lang
      ? { summary: "Set the lang attribute", detail: 'Add lang="en" (or your language) to the <html> element.', effort: "trivial" }
      : undefined,
  });

  return checks;
}
