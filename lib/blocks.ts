import type { BlockScores, ContentBlock, BlockKind } from "./types";

/**
 * Block-level extractability. This is the heart of the product — see
 * research/scoring-model.md §"Extractability, measured".
 *
 * Weights are fixed here and published on /methodology.
 */
export const SUB_WEIGHTS = {
  selfContainment: 0.3,
  answerDirectness: 0.25,
  lengthBand: 0.2,
  factualDensity: 0.15,
  readability: 0.1,
} as const;

export const SUB_LABELS: Record<keyof typeof SUB_WEIGHTS, string> = {
  selfContainment: "Self-contained",
  answerDirectness: "Answers up front",
  lengthBand: "Length band",
  factualDensity: "Factual density",
  readability: "Readability",
};

/**
 * Words that, at the start of a block, point at something outside the block.
 * A paragraph opening with one of these cannot be lifted out of the page.
 */
const DEIXIS = [
  "as mentioned", "as described", "as discussed", "as noted", "as we saw",
  "as shown", "the former", "the latter", "the same", "one of these",
  "all of these", "in addition", "additionally", "furthermore", "moreover",
  "however", "instead", "otherwise", "therefore", "consequently", "meanwhile",
  "it", "this", "that", "these", "those", "they", "them", "he", "she",
  "such", "here", "there", "above", "below", "but", "so", "then", "also",
  "again", "thus", "hence", "finally", "first", "second", "third", "next",
  "lastly", "another", "both", "either", "neither",
];

/** Openers that delay the claim instead of stating it. */
const PREAMBLE = [
  "in this article", "in this post", "in this guide", "in this section",
  "we will", "we'll", "let's", "let us", "you might be wondering",
  "before we", "now that", "if you've ever", "have you ever", "imagine",
  "in today's", "in the world of", "when it comes to", "there are many",
  "there is a lot", "one of the most", "it is important to note",
  "it's important to", "it is worth", "it's worth", "as you may know",
  "everyone knows", "we all know", "the purpose of this",
];

const ASSERTIVE_VERBS =
  /\b(is|are|was|were|means|refers to|describes|requires|includes|costs|takes|produces|delivers|equals|consists|comprises|allows|enables|prevents|causes|reduces|increases|improves|works by|happens when|occurs when)\b/i;

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\[])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Does the block name a proper noun of its own before the referring word? */
function hasInternalAntecedent(text: string, beforeIndex: number): boolean {
  const head = text.slice(0, beforeIndex);
  return /\b[A-Z][a-zA-Z]{2,}/.test(head.slice(1));
}

export function scoreSelfContainment(text: string): { score: number; note?: string } {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  let score = 1;
  let note: string | undefined;

  for (const term of DEIXIS) {
    const re = new RegExp("^" + term + "\\b", "i");
    if (re.test(lower)) {
      if (!hasInternalAntecedent(trimmed, term.length)) {
        score -= 0.55;
        note =
          'Opens with "' +
          trimmed.slice(0, term.length) +
          '" and never says what it refers to.';
      }
      break;
    }
  }

  const dangling = (
    lower.match(
      /\b(as mentioned above|as discussed earlier|see above|see below|the previous section|the following section)\b/g,
    ) ?? []
  ).length;
  if (dangling > 0) {
    score -= Math.min(0.3, dangling * 0.15);
    note = note ?? "Points at other parts of the page, so it does not stand alone.";
  }

  const hasProperNoun = /\b[A-Z][a-zA-Z]{2,}/.test(trimmed.slice(1));
  const hasNumber = /\d/.test(trimmed);
  if (!hasProperNoun && !hasNumber && words(trimmed).length > 25) {
    score -= 0.2;
    note = note ?? "Names no specific entity or figure, so it reads as generic filler.";
  }

  return { score: clamp(score), note };
}

export function scoreAnswerDirectness(text: string): { score: number; note?: string } {
  const sents = sentences(text);
  if (sents.length === 0) return { score: 0, note: "Empty block." };
  const first = sents[0];
  const lower = first.toLowerCase();
  let score = 0.55;
  let note: string | undefined;

  if (ASSERTIVE_VERBS.test(first)) score += 0.3;
  else note = "The opening sentence does not state a claim.";

  for (const p of PREAMBLE) {
    if (lower.startsWith(p)) {
      score -= 0.45;
      note =
        'Opens with preamble ("' +
        first.slice(0, 44).trim() +
        '…") instead of the answer.';
      break;
    }
  }

  if (/^[A-Z][^.!?]{2,60}\s+(is|are|means|refers to)\s+/.test(first)) {
    score += 0.2;
    note = undefined;
  }
  if (/\?$/.test(first) && sents.length > 1) score += 0.05;
  if (/^(some|many|most|arguably|perhaps|maybe|possibly|it seems|it appears)\b/i.test(first)) {
    score -= 0.15;
    note = note ?? "Opens with a hedge rather than a claim.";
  }

  return { score: clamp(score), note };
}

export function scoreLengthBand(wordCount: number): { score: number; note?: string } {
  if (wordCount >= 40 && wordCount <= 60) return { score: 1 };
  if (wordCount >= 130 && wordCount <= 170) return { score: 0.9 };
  if (wordCount >= 30 && wordCount < 40) return { score: 0.85 };
  if (wordCount > 60 && wordCount <= 90) return { score: 0.85 };
  if (wordCount > 90 && wordCount < 130) return { score: 0.75 };
  if (wordCount > 170 && wordCount <= 220)
    return {
      score: 0.6,
      note: wordCount + " words — long enough that an assistant will truncate it.",
    };
  if (wordCount >= 20 && wordCount < 30)
    return { score: 0.6, note: wordCount + " words — thin for a standalone answer." };
  if (wordCount >= 15 && wordCount < 20)
    return { score: 0.4, note: wordCount + " words — too thin to be lifted as an answer." };
  if (wordCount < 15)
    return { score: 0.2, note: wordCount + " words — a fragment, not an answer." };
  return {
    score: 0.35,
    note: wordCount + " words — well past the length an assistant will quote.",
  };
}

export function scoreFactualDensity(text: string): { score: number; note?: string } {
  const w = words(text);
  if (w.length === 0) return { score: 0 };
  const numbers = (text.match(/\b\d[\d,.]*\b/g) ?? []).length;
  const percents = (text.match(/\d+(\.\d+)?\s?%/g) ?? []).length;
  const currency = (text.match(/[$£€₹]\s?\d/g) ?? []).length;
  const years = (text.match(/\b(19|20)\d{2}\b/g) ?? []).length;
  const propers = (text.slice(1).match(/\b[A-Z][a-zA-Z]{2,}/g) ?? []).length;
  const attributions = (
    text.match(
      /\b(according to|per |reported by|study|research|survey|analysis|data from|found that)\b/gi,
    ) ?? []
  ).length;

  const per100 =
    ((numbers +
      percents * 2 +
      currency * 2 +
      years +
      propers * 0.5 +
      attributions * 2) /
      w.length) *
    100;

  const score = clamp(per100 / 8);
  const note =
    per100 < 1.5
      ? "No figures, dates or named sources — nothing here is quotable as evidence."
      : undefined;
  return { score, note };
}

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
}

export function scoreReadability(text: string): { score: number; note?: string } {
  const sents = sentences(text);
  const w = words(text);
  if (sents.length === 0 || w.length === 0) return { score: 0 };
  const wps = w.length / sents.length;
  const spw = w.reduce((n, x) => n + syllables(x), 0) / w.length;
  const grade = 0.39 * wps + 11.8 * spw - 15.59;

  let score: number;
  if (grade >= 7 && grade <= 12) score = 1;
  else if (grade > 12 && grade <= 15) score = 0.75;
  else if (grade > 15 && grade <= 18) score = 0.45;
  else if (grade > 18) score = 0.2;
  else if (grade >= 5) score = 0.85;
  else score = 0.6;

  let note: string | undefined;
  if (wps > 30) {
    score = Math.min(score, 0.35);
    note =
      "Average sentence runs " +
      Math.round(wps) +
      " words — assistants clip long sentences mid-thought.";
  } else if (grade > 16) {
    note =
      "Reads at roughly grade " +
      Math.round(grade) +
      " — dense enough that extraction gets lossy.";
  }
  return { score, note };
}

export interface ScoredBlock {
  scores: BlockScores;
  notes: string[];
}

export function scoreBlockText(text: string, kind: BlockKind = "paragraph"): ScoredBlock {
  const w = words(text).length;
  const sc = scoreSelfContainment(text);
  const ad = scoreAnswerDirectness(text);
  const lb = scoreLengthBand(w);
  const fd = scoreFactualDensity(text);
  const rd = scoreReadability(text);

  // Tables and FAQ blocks are structurally extractable; directness matters less.
  const directness =
    kind === "table" || kind === "faq" ? Math.max(ad.score, 0.8) : ad.score;

  const total =
    sc.score * SUB_WEIGHTS.selfContainment +
    directness * SUB_WEIGHTS.answerDirectness +
    lb.score * SUB_WEIGHTS.lengthBand +
    fd.score * SUB_WEIGHTS.factualDensity +
    rd.score * SUB_WEIGHTS.readability;

  const notes = [sc.note, ad.note, lb.note, fd.note, rd.note].filter(
    (n): n is string => Boolean(n),
  );

  return {
    scores: {
      selfContainment: round(sc.score),
      answerDirectness: round(directness),
      lengthBand: round(lb.score),
      factualDensity: round(fd.score),
      readability: round(rd.score),
      total: round(total),
    },
    notes,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Page extractability = length-weighted mean of block totals. */
export function pageExtractability(blocks: ContentBlock[]): number {
  if (blocks.length === 0) return 0;
  const totalWords = blocks.reduce((n, b) => n + b.words, 0);
  if (totalWords === 0) return 0;
  const weighted = blocks.reduce((n, b) => n + b.scores.total * b.words, 0);
  return round(weighted / totalWords);
}

export function countWords(text: string): number {
  return words(text).length;
}

export { sentences };
