import type { BlockScores } from "../types";

/**
 * Measured lift per tactic — Princeton GEO study, KDD 2024, evaluated against Perplexity.
 * These are published figures for the tactic in general. They are never presented as a
 * prediction about the user's page. See research/SUMMARY.md finding #4.
 */
export const GEO_TACTICS = [
  { id: "cite-sources", name: "Cite sources", publishedLift: "+40%" },
  { id: "add-statistics", name: "Add statistics", publishedLift: "+37%" },
  { id: "add-quotations", name: "Add quotations", publishedLift: "+30%" },
  { id: "authoritative-tone", name: "Authoritative tone", publishedLift: "+25%" },
  { id: "improve-clarity", name: "Improve clarity", publishedLift: "+20%" },
  { id: "technical-terms", name: "Technical terms", publishedLift: "+18%" },
  { id: "unique-vocabulary", name: "Unique vocabulary", publishedLift: "+15%" },
  { id: "fluency", name: "Fluency optimisation", publishedLift: "+15–30%" },
] as const;

export type TacticId = (typeof GEO_TACTICS)[number]["id"];

/** Pick the tactics that address this block's actual weaknesses. */
export function tacticsFor(scores: BlockScores): TacticId[] {
  const picked: TacticId[] = [];
  if (scores.selfContainment < 0.7) picked.push("improve-clarity");
  if (scores.answerDirectness < 0.7) picked.push("authoritative-tone");
  if (scores.factualDensity < 0.5) picked.push("add-statistics");
  if (scores.readability < 0.7) picked.push("fluency");
  if (picked.length === 0) picked.push("improve-clarity", "fluency");
  return picked;
}

export const SYSTEM_PROMPT = `You rewrite web copy so that AI assistants can quote it.

An assistant answering a question does not read a page — it lifts one passage out and
presents it as the answer. Your job is to make the passage you are given survive that
lift: complete on its own, claim first, tight, specific.

HOW TO REWRITE

1. Self-containment. Name the subject in the first sentence. Never open with "it", "this",
   "these", "they" or any reference to something outside the passage. Delete every phrase
   like "as mentioned above" or "in the previous section".
2. Answer first. State the claim in sentence one, then support it. Delete preamble openers
   ("In this article we will…", "When it comes to…", "There are many…").
3. Length. Aim for 40-60 words when the passage answers a question; up to about 160 when it
   genuinely needs to explain something. Never exceed 200.
4. Specificity. Keep every concrete figure, date, name and proper noun from the source. Prefer
   the specific noun over the general one.
5. Plain sentences. Under about 25 words each. One idea per sentence.
6. Voice. Keep the source's voice and register. This is the author's copy, not yours.

ABSOLUTE CONSTRAINTS — a rewrite that breaks any of these is a failure, not a stylistic choice:

- NEVER invent a fact, figure, statistic, date, percentage, price, name, quote, study,
  source or claim that is not present in the source text. If the source has no data, the
  rewrite has no data. You may say the copy needs evidence in your note; you may not supply it.
- NEVER add a citation, link, or attribution that was not in the source.
- NEVER repeat a keyword to make the passage look optimised. Keyword stuffing measurably
  REDUCES AI visibility by about 10%. Vary the vocabulary instead.
- NEVER change the meaning, the recommendation, or the strength of a claim. If the source
  hedges, the rewrite hedges.
- NEVER add marketing language, superlatives, or enthusiasm that was not there.
- NEVER pad to hit a word count. Shorter than the source is usually correct.

OUTPUT

Return strictly this JSON and nothing else:
{"rewritten": "<the rewritten passage as plain text>", "changes": ["<short note>", "..."], "needsEvidence": <true|false>}

"changes" holds at most four short notes on what you changed and why, written for the page's
author. Set "needsEvidence" to true when the passage makes claims that would be far more
citable with a figure or source the author would have to supply.`;

export function buildUserPrompt(args: {
  text: string;
  heading?: string;
  pageTitle?: string | null;
  scores: BlockScores;
  notes: string[];
}): string {
  const weaknesses = args.notes.length
    ? args.notes.map((n) => `- ${n}`).join("\n")
    : "- No specific weakness flagged; tighten for extraction.";

  return `PAGE: ${args.pageTitle ?? "(untitled)"}
${args.heading ? `SECTION HEADING: ${args.heading}\n` : ""}
WHAT THE SCORER FLAGGED ON THIS PASSAGE:
${weaknesses}

SUB-SCORES (0–1): self-containment ${args.scores.selfContainment}, answers-up-front ${args.scores.answerDirectness}, length band ${args.scores.lengthBand}, factual density ${args.scores.factualDensity}, readability ${args.scores.readability}.

PASSAGE TO REWRITE:
"""
${args.text}
"""

Rewrite it. Remember: you may not add any fact that is not already above.`;
}
