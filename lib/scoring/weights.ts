import type { Category, Engine } from "../types";

/**
 * The only place weights live. Published verbatim on /methodology.
 * Justification per number: research/scoring-model.md.
 */
export const BASE_WEIGHTS: Record<Category, number> = {
  extractability: 30,
  "answer-structure": 18,
  "evidence-density": 16,
  "machine-readability": 14,
  authority: 12,
  retrievability: 10,
};

/**
 * Per-engine multipliers applied to the base weights, then normalised back to 100.
 * These encode the real differences between the engines — most importantly that
 * Google states AI-specific files and chunking are NOT required, so extractability
 * and machine-readability are down-weighted for AI Overviews rather than up.
 */
export const ENGINE_MULTIPLIERS: Record<Engine, Record<Category, number>> = {
  "google-aio": {
    extractability: 0.8,
    "answer-structure": 0.9,
    "evidence-density": 1.1,
    "machine-readability": 1.2,
    authority: 1.4,
    retrievability: 1.1,
  },
  chatgpt: {
    extractability: 1.3,
    "answer-structure": 1.2,
    "evidence-density": 1.1,
    "machine-readability": 0.8,
    authority: 1.2,
    retrievability: 0.9,
  },
  perplexity: {
    extractability: 1.2,
    "answer-structure": 1.3,
    "evidence-density": 1.2,
    "machine-readability": 1.3,
    authority: 1.0,
    retrievability: 0.8,
  },
  claude: {
    extractability: 1.1,
    "answer-structure": 1.0,
    "evidence-density": 1.5,
    "machine-readability": 0.9,
    authority: 1.2,
    retrievability: 0.8,
  },
  copilot: {
    extractability: 1.0,
    "answer-structure": 1.1,
    "evidence-density": 0.9,
    "machine-readability": 1.1,
    authority: 1.0,
    retrievability: 1.3,
  },
};

export const ENGINE_RATIONALE: Record<Engine, string> = {
  "google-aio":
    "Runs on core Search ranking, so E-E-A-T carries the most weight. Google states plainly that AI-specific files and chunked content are not required — so this is the one engine where a missing llms.txt is not held against you.",
  chatgpt:
    "Content-answer fit dominates: how closely a passage matches the shape of the answer ChatGPT would write accounts for roughly 55% of citation likelihood, far above domain authority. Freshness is a strong secondary signal.",
  perplexity:
    "The most structure-sensitive of the five. FAQPage JSON-LD and atomic, self-contained paragraphs are its documented preferences, and it evaluates new content quickly.",
  claude:
    "Cites selectively and rewards factual density above everything else — specific numbers, named sources, dated claims. Evidence density carries a 1.5x multiplier here for that reason.",
  copilot:
    "Runs on the Bing index, so ordinary retrievability and page weight matter more than elsewhere; sub-2s load is a real threshold.",
};

/** Normalised weights for one engine — always sums to 100. */
export function weightsFor(engine: Engine): Record<Category, number> {
  const mult = ENGINE_MULTIPLIERS[engine];
  const raw = Object.fromEntries(
    (Object.keys(BASE_WEIGHTS) as Category[]).map((c) => [c, BASE_WEIGHTS[c] * mult[c]]),
  ) as Record<Category, number>;
  const sum = Object.values(raw).reduce((a, b) => a + b, 0);
  return Object.fromEntries(
    (Object.keys(raw) as Category[]).map((c) => [c, Math.round((raw[c] / sum) * 1000) / 10]),
  ) as Record<Category, number>;
}

/** A failed gate caps the affected engines here. See research/scoring-model.md. */
export const GATE_CAP = 25;
