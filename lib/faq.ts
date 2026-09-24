/**
 * The single source of truth for the FAQ. Rendered as visible copy on the home page
 * and emitted as FAQPage JSON-LD on the home page — structured data that describes
 * content a visitor cannot see is invalid, so the two must come from the same array.
 *
 * Every answer opens with its claim: this page is audited by its own engine.
 */
export interface FaqEntry {
  q: string;
  a: string;
  /** A primary source for the answer's central claim, linked under it. */
  source?: { label: string; url: string };
}

const GOOGLE_AI_FEATURES = {
  label: "Google Search Central — AI features and your website",
  url: "https://developers.google.com/search/docs/appearance/ai-features",
};

const GEO_PAPER = {
  label: "Aggarwal et al., “GEO: Generative Engine Optimization”, KDD 2024",
  url: "https://arxiv.org/abs/2311.09735",
};

export const FAQ: FaqEntry[] = [
  {
    q: "What is generative engine optimisation?",
    a: "Generative engine optimisation (GEO) is the practice of structuring content so AI assistants can extract and cite it. Traditional SEO gets a page ranked; GEO gets a passage quoted inside an AI-generated answer. The two are only loosely correlated — roughly 15% of Google AI Overview sources overlap with the traditional top ten results.",
    source: GEO_PAPER,
  },
  {
    q: "Why does Crawlspace give five scores instead of one?",
    a: "Five scores are necessary because the engines disagree. Google states that AI-specific files and markup are not required for its AI features, while ChatGPT, Claude and Perplexity reward exactly those things. Crawlspace runs one evidence pass through five weight vectors, so a page can score 81 for one engine and 44 for another. A single blended number would hide the difference that matters.",
    source: GOOGLE_AI_FEATURES,
  },
  {
    q: "Does blocking AI crawlers affect whether you get cited?",
    a: "Blocking an engine's crawler is a complete block on being cited by it. If robots.txt disallows GPTBot, PerplexityBot or ClaudeBot, that engine cannot use the page at all — no amount of schema or structure compensates. CCBot is the exception: it feeds Common Crawl, which is used for model training rather than citation, so blocking it costs no AI visibility.",
  },
  {
    q: "How long should a paragraph be to get quoted?",
    a: "The quotable length is 40 to 60 words when a passage answers a question, and up to about 160 when it genuinely needs to explain something. Below 15 words there is no answer to lift; past roughly 220 an assistant truncates the passage mid-argument. Crawlspace scores every block against those bands.",
  },
  {
    q: "What actually makes a passage more citable?",
    a: "Citing sources is the largest single lift the Princeton GEO study measured against Perplexity, at 40%. Adding statistics gained 37%, adding quotations 30%, and an authoritative tone 25%. Keyword stuffing reduced visibility by 10%, so the usual SEO reflex makes AI citability worse rather than better.",
    source: GEO_PAPER,
  },
  {
    q: "Do I need an llms.txt file?",
    a: "An llms.txt file is worth adding and not worth panicking about. Crawlspace scores it for ChatGPT, Claude and Perplexity but not for Google, because Google's own guidance states that no special markup or AI files are required for AI Overviews. The file is a ten-minute job and it helps the other three.",
    source: GOOGLE_AI_FEATURES,
  },
];
