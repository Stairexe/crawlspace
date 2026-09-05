/**
 * The single source of truth for the FAQ. Rendered as visible copy on the home page
 * and emitted as FAQPage JSON-LD in the root layout — structured data that describes
 * content a visitor cannot see is invalid, so the two must come from the same array.
 */
export interface FaqEntry {
  q: string;
  a: string;
}

export const FAQ: FaqEntry[] = [

  {
    q: "What is generative engine optimisation?",
    a: "Generative engine optimisation (GEO) is the practice of structuring content so AI assistants can extract and cite it. Traditional SEO gets a page ranked; GEO gets a passage quoted inside an AI-generated answer. The two are only loosely correlated — roughly 15% of Google AI Overview sources overlap with the traditional top ten results.",
  },
  {
    q: "Why does Crawlspace give five scores instead of one?",
    a: "Because the engines genuinely disagree. Google states that AI-specific files and chunked content are not required for AI Overviews, while ChatGPT, Claude and Perplexity reward exactly those things. Crawlspace runs one evidence pass through five weight vectors, so a page can score 81 for one engine and 44 for another. A single blended number would hide the difference that matters.",
  },
  {
    q: "Does blocking AI crawlers affect whether you get cited?",
    a: "Yes, completely. If robots.txt disallows GPTBot, PerplexityBot or ClaudeBot, that engine cannot cite the page at all — no amount of schema or structure compensates. CCBot is the exception: it feeds Common Crawl, which is used for model training rather than citation, so blocking it costs no AI visibility.",
  },
  {
    q: "How long should a paragraph be to get quoted?",
    a: "Aim for 40 to 60 words when the passage answers a question, and up to about 160 when it genuinely needs to explain something. Below 15 words there is no answer to lift; past roughly 220 an assistant truncates the passage mid-argument. Crawlspace scores every block against those bands.",
  },
  {
    q: "What actually makes a passage more citable?",
    a: "The Princeton GEO study measured the lift per tactic against Perplexity: citing sources gained 40%, adding statistics 37%, adding quotations 30%, and an authoritative tone 25%. Keyword stuffing reduced visibility by 10%, so the usual SEO reflex makes AI citability worse rather than better.",
  },
  {
    q: "Do I need an llms.txt file?",
    a: "It depends on the engine, which is why Crawlspace scores it for ChatGPT, Claude and Perplexity but not for Google. Google's own guidance states that no special markup or AI files are required for AI Overviews. The file is a ten-minute job and it helps the other three, so the honest answer is that it is worth adding and not worth panicking about.",
  },
];
