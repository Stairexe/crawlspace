// The four types the whole product is built from. Nothing else declares them.
// See docs/ARCHITECTURE.md §3.

export type Engine =
  | "google-aio"
  | "chatgpt"
  | "perplexity"
  | "claude"
  | "copilot";

export const ENGINES: Engine[] = [
  "google-aio",
  "chatgpt",
  "perplexity",
  "claude",
  "copilot",
];

export const ENGINE_LABELS: Record<Engine, string> = {
  "google-aio": "Google AI Overviews",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  claude: "Claude",
  copilot: "Copilot",
};

export const ENGINE_SHORT: Record<Engine, string> = {
  "google-aio": "AI Overviews",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  claude: "Claude",
  copilot: "Copilot",
};

export type Category =
  | "extractability"
  | "answer-structure"
  | "evidence-density"
  | "machine-readability"
  | "authority"
  | "retrievability";

export const CATEGORIES: Category[] = [
  "extractability",
  "answer-structure",
  "evidence-density",
  "machine-readability",
  "authority",
  "retrievability",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  extractability: "Extractability",
  "answer-structure": "Answer structure",
  "evidence-density": "Evidence density",
  "machine-readability": "Machine readability",
  authority: "Authority signals",
  retrievability: "Retrievability",
};

export const CATEGORY_BLURBS: Record<Category, string> = {
  extractability:
    "Whether a paragraph still makes sense when an assistant lifts it out of the page.",
  "answer-structure":
    "Headings phrased as questions, answers stated up front, tables and lists where they belong.",
  "evidence-density":
    "Statistics, named sources, quotes and dates — the things that make a passage worth citing.",
  "machine-readability":
    "JSON-LD, semantic HTML, llms.txt, sitemap — what a machine reads before it reads your prose.",
  authority:
    "A named author with credentials, an organisation entity, and a visible last-updated date.",
  retrievability:
    "Title, description, canonical, heading hierarchy, links, weight — the retrieval basics.",
};

export type Severity = "critical" | "high" | "medium" | "low";
export type Effort = "trivial" | "small" | "medium" | "large";
export type CheckStatus = "pass" | "warn" | "fail" | "na";

export type BlockKind =
  | "paragraph"
  | "list"
  | "table"
  | "faq"
  | "heading-lead";

export interface BlockScores {
  selfContainment: number; // 0..1
  answerDirectness: number;
  lengthBand: number;
  factualDensity: number;
  readability: number;
  total: number; // weighted 0..1
}

export interface ContentBlock {
  id: string;
  kind: BlockKind;
  heading?: string;
  text: string;
  words: number;
  domPath: string;
  scores: BlockScores;
  notes: string[];
}

export interface RobotRule {
  agent: string;
  allowed: boolean;
  reason: string;
  matchedLine?: string;
}

export interface Evidence {
  url: string;
  finalUrl: string;
  status: number;
  fetchedAt: string;
  timings: { totalMs: number; fetchMs: number };
  html: {
    title: string | null;
    metaDescription: string | null;
    canonical: string | null;
    lang: string | null;
    htmlBytes: number;
    textWords: number;
    textBytes: number;
    textToHtmlRatio: number;
  };
  headings: { level: number; text: string }[];
  blocks: ContentBlock[];
  jsonLd: { types: string[]; raw: unknown }[];
  microdata: string[];
  robots: {
    found: boolean;
    status: number | null;
    rules: Record<string, RobotRule>;
    metaRobots: string | null;
    xRobotsTag: string | null;
  };
  llmsTxt: { found: boolean; valid: boolean; issues: string[]; bytes: number };
  sitemap: { found: boolean; inRobots: boolean };
  links: {
    internal: number;
    external: number;
    externalCitations: number;
    citationDomains: string[];
  };
  media: { images: number; withAlt: number };
  dates: { published: string | null; modified: string | null; visibleDate: string | null };
  author: { name: string | null; hasSchema: boolean; hasBio: boolean };
  semantics: {
    main: boolean;
    article: boolean;
    nav: boolean;
    header: boolean;
    footer: boolean;
    h1Count: number;
    hierarchyOk: boolean;
  };
  signals: {
    stats: number;
    percentages: number;
    years: number;
    quotes: number;
    tables: number;
    lists: number;
    faqPairs: number;
    questionHeadings: number;
  };
  renderedWithoutJs: boolean;
  frameworkHint: string | null;
}

export interface CheckFix {
  summary: string;
  detail: string;
  effort: Effort;
  rewritable?: boolean;
  generates?: "llms.txt" | "jsonld";
}

export interface CheckResult {
  id: string;
  category: Category;
  label: string;
  status: CheckStatus;
  value: number; // 0..1 normalised contribution
  weight: number; // relative weight inside its category
  gate?: Engine[] | "all";
  evidence: string;
  engines?: Engine[]; // engines actually affected when failing
  fix?: CheckFix;
}

export interface Finding {
  checkId: string;
  label: string;
  category: Category;
  severity: Severity;
  effort: Effort;
  engines: Engine[];
  evidence: string;
  fix: CheckFix;
  status: CheckStatus;
}

export interface EngineScore {
  score: number;
  capped: boolean;
  capReason?: string;
  categories: Record<Category, number>;
}

export interface AuditReport {
  version: string;
  evidence: Evidence;
  checks: CheckResult[];
  engines: Record<Engine, EngineScore>;
  composite: number;
  spread: number;
  findings: Finding[];
  weakestBlocks: ContentBlock[];
  strongestBlock: ContentBlock | null;
  summary: string;
}

export interface RewriteResult {
  blockId: string;
  original: string;
  rewritten: string;
  before: BlockScores;
  after: BlockScores;
  delta: number;
  tacticsApplied: { name: string; publishedLift: string }[];
  provider: string;
  notes: string[];
}

export interface ApiError {
  error: string;
  code: string;
}
