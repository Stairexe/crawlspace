/**
 * The glossary: one array, rendered as visible definitions on /glossary and emitted as
 * DefinedTermSet JSON-LD from the same data. Each definition opens with the claim, so
 * any one of them can be lifted out of the page and still stand on its own.
 */
export interface Term {
  id: string;
  term: string;
  definition: string;
  /** Where the definition's central claim comes from, when it is not general usage. */
  source?: { label: string; url: string };
  /** Where Crawlspace measures this, if it does. */
  seeAlso?: { label: string; href: string };
}

export const GLOSSARY: Term[] = [
  {
    id: "geo",
    term: "Generative engine optimisation (GEO)",
    definition:
      "Generative engine optimisation is the practice of structuring content so AI assistants can find, extract and cite it inside a generated answer. The term was introduced by a 2023 Princeton-led paper, which measured that citing sources, adding statistics and adding quotations each raised a page's visibility in generated answers, while keyword stuffing lowered it.",
    source: { label: "Aggarwal et al., GEO, KDD 2024", url: "https://arxiv.org/abs/2311.09735" },
  },
  {
    id: "ai-overviews",
    term: "AI Overviews",
    definition:
      "AI Overviews are the generated summaries Google shows above its search results, each with links to the pages it drew on. Google states that pages need no special markup or AI-specific files to appear in them; the ordinary Search requirements — indexable, crawlable, helpful content — apply.",
    source: {
      label: "Google Search Central — AI features and your website",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
  },
  {
    id: "citation",
    term: "Citation (in an AI answer)",
    definition:
      "A citation is a link or source reference an AI assistant attaches to a generated answer, pointing at the page a statement came from. Being cited is different from ranking: an assistant can rank a page highly in its retrieval step and still quote a different one.",
  },
  {
    id: "citability",
    term: "Citability",
    definition:
      "Citability is how easily an assistant can lift a passage out of a page and quote it accurately. Crawlspace measures it block by block — whether each paragraph names its own subject, states its answer first, sits in a quotable length and carries specific facts.",
    seeAlso: { label: "How a passage is scored", href: "/methodology#blocks" },
  },
  {
    id: "search-crawler",
    term: "Search crawler (citation crawler)",
    definition:
      "A search crawler is the bot an AI engine uses to index pages it may later cite, such as OAI-SearchBot for ChatGPT search, Claude-SearchBot, PerplexityBot, Googlebot and Bingbot. Blocking an engine's search crawler in robots.txt stops that engine citing the page, which is why Crawlspace treats it as a gate.",
    seeAlso: { label: "The crawlers checked", href: "/methodology#crawlers" },
  },
  {
    id: "training-crawler",
    term: "Training crawler",
    definition:
      "A training crawler collects pages for training AI models rather than for answering questions — GPTBot, ClaudeBot, Google-Extended, Applebot-Extended and CCBot among them. OpenAI, Anthropic and Google each document that blocking their training crawler does not remove a site from their search or answers, so a site can refuse training and still be cited.",
  },
  {
    id: "user-fetcher",
    term: "User-triggered fetcher",
    definition:
      "A user-triggered fetcher is the agent an assistant sends when a person asks it to read a specific page, such as ChatGPT-User, Claude-User or Perplexity-User. It fetches on demand rather than crawling, and robots.txt rules for it decide whether the assistant can open the page when asked.",
  },
  {
    id: "robots-txt",
    term: "robots.txt",
    definition:
      "robots.txt is a plain-text file at a site's root that tells crawlers, by user-agent name, which paths they may fetch. It is a published convention (RFC 9309) that well-behaved crawlers follow; it is not access control.",
    source: { label: "RFC 9309 — Robots Exclusion Protocol", url: "https://www.rfc-editor.org/rfc/rfc9309" },
  },
  {
    id: "llms-txt",
    term: "llms.txt",
    definition:
      "llms.txt is a proposed markdown file at a site's root that gives language models a short summary of the site and links to its key pages. It is a proposal, not a standard: Google has said its AI features do not need it, and Crawlspace scores it for ChatGPT, Claude and Perplexity only.",
    source: { label: "llmstxt.org — the proposal", url: "https://llmstxt.org" },
  },
  {
    id: "json-ld",
    term: "JSON-LD (structured data)",
    definition:
      "JSON-LD is a way of embedding structured data in a page — who published it, what type of content it is, when it changed — using the schema.org vocabulary inside a script tag. Machines read it before the prose, and it is how a page states facts about itself without leaving them to inference.",
    source: { label: "schema.org", url: "https://schema.org/docs/about.html" },
  },
  {
    id: "same-as",
    term: "sameAs",
    definition:
      "sameAs is the schema.org property that lists a thing's other identities on the web — an organisation's Wikidata item, Wikipedia article, LinkedIn and GitHub pages. It lets a machine tie the brand on this page to the same brand everywhere else.",
    source: { label: "schema.org — sameAs", url: "https://schema.org/sameAs" },
  },
  {
    id: "wikidata",
    term: "Wikidata",
    definition:
      "Wikidata is the free, openly editable knowledge graph run by the Wikimedia Foundation, with an item for each notable entity and a property (P856) for its official website. Crawlspace looks a domain up there by that property, never by name, to see whether the publisher is a known entity.",
    source: { label: "Wikidata — notability policy", url: "https://www.wikidata.org/wiki/Wikidata:Notability" },
    seeAlso: { label: "Known-entity presence", href: "/methodology#entity" },
  },
  {
    id: "extractability",
    term: "Extractability",
    definition:
      "Extractability is Crawlspace's name for whether a passage still makes sense when an assistant lifts it out of its page. It is the heaviest category in the model, at 30 of 100 base points, because an unliftable passage cannot be quoted however good the page is.",
    seeAlso: { label: "Categories and base weights", href: "/methodology#categories" },
  },
  {
    id: "self-containment",
    term: "Self-containment",
    definition:
      "A self-contained passage names its own subject instead of leaning on the text around it. One that opens with “it”, “this” or “as mentioned above” loses its meaning when quoted alone, and Crawlspace marks it down.",
  },
  {
    id: "answer-directness",
    term: "Answer directness",
    definition:
      "Answer directness is whether a passage states its answer in the first sentence. “X is Y” is direct; “In this article we will look at X” is preamble, and an assistant looking for the answer has to skip it.",
  },
  {
    id: "gate",
    term: "Gate",
    definition:
      "A gate is a Crawlspace failure that caps a score at 25 instead of subtracting points, because it stops an engine using the page at all: robots.txt blocking the engine's citation crawlers, a non-2xx response, or content that only appears after JavaScript runs.",
    seeAlso: { label: "The three gates", href: "/methodology#gates" },
  },
  {
    id: "engine-score",
    term: "Engine score, composite and spread",
    definition:
      "An engine score is the page's 0–100 citability for one engine, from that engine's own weight vector. The composite is the mean of the five, and the spread is the gap between the highest and lowest — a wide spread means the page suits some engines far better than others.",
  },
  {
    id: "fix-plan",
    term: "Fix plan",
    definition:
      "The fix plan is Crawlspace's ordered list of the fixes worth the most points, each with the composite score after it. The numbers come from re-running the scorer with that check passing, so they project the model's own scoring — not a promise about citations.",
  },
  {
    id: "keyword-stuffing",
    term: "Keyword stuffing",
    definition:
      "Keyword stuffing is repeating the same phrase far more often than the writing needs. The Princeton GEO study measured it reducing visibility in generated answers by about 10%, and Crawlspace flags pages where one three-word phrase repeats at an unusual rate.",
    source: { label: "Aggarwal et al., GEO, KDD 2024", url: "https://arxiv.org/abs/2311.09735" },
  },
  {
    id: "server-rendering",
    term: "Server-side rendering",
    definition:
      "A server-rendered page sends its content in the HTML itself; a client-rendered one sends an empty shell and builds the content with JavaScript. Most AI crawlers do not run JavaScript, so a client-rendered page can reach them with nothing to quote.",
  },
  {
    id: "canonical",
    term: "Canonical URL",
    definition:
      "The canonical URL is the address a page declares as its main version with a link rel=\"canonical\" tag. It tells crawlers which of several duplicate addresses to index and credit.",
  },
  {
    id: "eeat",
    term: "E-E-A-T",
    definition:
      "E-E-A-T stands for experience, expertise, authoritativeness and trustworthiness — the qualities Google's search quality rater guidelines ask raters to assess. Named authors, stated credentials and visible dates are the on-page signals of it that Crawlspace can check.",
    source: {
      label: "Google — creating helpful, reliable, people-first content",
      url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    },
  },
  {
    id: "rag",
    term: "Retrieval-augmented generation (RAG)",
    definition:
      "Retrieval-augmented generation is how answer engines work: retrieve relevant passages from an index first, then have a language model write an answer grounded in them. It is why passage-level quality matters — the model only sees the chunks retrieval hands it, not the whole page.",
  },
  {
    id: "query-fan-out",
    term: "Query fan-out",
    definition:
      "Query fan-out is the technique of splitting one question into many related sub-queries, searching each, and combining the results into a single answer. Google describes AI Mode as using it, which means a page can be cited for a question it never literally answers.",
  },
];
