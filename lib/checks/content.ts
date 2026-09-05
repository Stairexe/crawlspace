import type { CheckResult, Evidence } from "../types";
import { pageExtractability } from "../blocks";

const pct = (n: number) => Math.round(n * 100);

/** Extractability (30) + answer structure (18) + evidence density (16). */
export function contentChecks(e: Evidence): CheckResult[] {
  const checks: CheckResult[] = [];
  const blocks = e.blocks;
  const totalWords = blocks.reduce((n, b) => n + b.words, 0);

  // ---- Extractability -------------------------------------------------------
  const extract = pageExtractability(blocks);
  checks.push({
    id: "block-extractability",
    category: "extractability",
    label: "Blocks survive being lifted out of the page",
    status: extract >= 0.7 ? "pass" : extract >= 0.5 ? "warn" : "fail",
    value: extract,
    weight: 10,
    evidence: blocks.length
      ? `${blocks.length} content blocks scored; length-weighted mean ${pct(extract)}/100.`
      : "No content blocks of 12+ words were found on the page.",
    fix:
      extract < 0.7
        ? {
            summary: "Rewrite the weakest blocks so each one stands alone",
            detail:
              "Assistants quote passages, not pages. Each paragraph should make sense with the rest of the page deleted: " +
              "name the subject instead of saying 'it', state the claim in the first sentence, and land in the 40–60 word band.",
            effort: "medium",
            rewritable: true,
          }
        : undefined,
  });

  const weak = blocks.filter((b) => b.scores.selfContainment < 0.6);
  checks.push({
    id: "self-contained-blocks",
    category: "extractability",
    label: "Paragraphs name their own subject",
    status: !blocks.length ? "na" : weak.length / blocks.length < 0.2 ? "pass" : weak.length / blocks.length < 0.4 ? "warn" : "fail",
    value: blocks.length ? 1 - weak.length / blocks.length : 0,
    weight: 8,
    evidence: blocks.length
      ? `${weak.length} of ${blocks.length} blocks open with a reference to something outside themselves.`
      : "No blocks to assess.",
    fix: weak.length
      ? {
          summary: "Replace opening pronouns with the actual subject",
          detail:
            'A paragraph that starts "This means…" is unusable out of context. Name the thing: "Generative engine optimisation means…". ' +
            "This is the single cheapest extractability fix and it changes nothing for human readers.",
          effort: "small",
          rewritable: true,
        }
      : undefined,
  });

  const direct = blocks.filter((b) => b.scores.answerDirectness >= 0.7).length;
  checks.push({
    id: "answers-up-front",
    category: "extractability",
    label: "Answers stated before the build-up",
    status: !blocks.length ? "na" : direct / blocks.length >= 0.5 ? "pass" : direct / blocks.length >= 0.3 ? "warn" : "fail",
    value: blocks.length ? direct / blocks.length : 0,
    weight: 7,
    evidence: blocks.length
      ? `${direct} of ${blocks.length} blocks lead with a claim rather than a preamble.`
      : "No blocks to assess.",
    fix:
      blocks.length && direct / blocks.length < 0.5
        ? {
            summary: "Put the claim in the first sentence",
            detail:
              "Assistants extract the opening of a passage. Move the answer to the front and use the rest of the paragraph to support it. " +
              'Delete openers like "In this article we will look at…".',
            effort: "small",
            rewritable: true,
          }
        : undefined,
  });

  const inBand = blocks.filter((b) => b.scores.lengthBand >= 0.85).length;
  checks.push({
    id: "answer-length-band",
    category: "extractability",
    label: "Blocks sit in a quotable length band",
    status: !blocks.length ? "na" : inBand / blocks.length >= 0.5 ? "pass" : inBand / blocks.length >= 0.3 ? "warn" : "fail",
    value: blocks.length ? inBand / blocks.length : 0,
    weight: 5,
    evidence: blocks.length
      ? `${inBand} of ${blocks.length} blocks fall in the 30–90 or 130–170 word bands. Mean block length ${Math.round(totalWords / blocks.length)} words.`
      : "No blocks to assess.",
    fix:
      blocks.length && inBand / blocks.length < 0.5
        ? {
            summary: "Split the long paragraphs, merge the fragments",
            detail:
              "40–60 words is the band that gets quoted whole; 130–170 works for explanatory passages. " +
              "Anything past ~220 words gets truncated mid-argument, and anything under 15 is too thin to answer anything.",
            effort: "small",
            rewritable: true,
          }
        : undefined,
  });

  // ---- Answer structure -----------------------------------------------------
  const qh = e.signals.questionHeadings;
  const headingCount = e.headings.filter((h) => h.level >= 2).length;
  checks.push({
    id: "question-headings",
    category: "answer-structure",
    label: "Headings phrased the way people ask",
    status: qh >= 3 ? "pass" : qh >= 1 ? "warn" : "fail",
    value: Math.min(1, qh / 4),
    weight: 6,
    evidence: `${qh} of ${headingCount} H2+ headings are phrased as a question or start with what/how/why.`,
    fix:
      qh < 3
        ? {
            summary: "Rewrite section headings as the questions they answer",
            detail:
              '"Pricing" answers nothing. "How much does X cost?" matches the query, and the passage under it becomes the answer. ' +
              "This also feeds Google's query fan-out, which retrieves against related questions rather than your exact keyword.",
            effort: "trivial",
            rewritable: true,
          }
        : undefined,
  });

  checks.push({
    id: "faq-block",
    category: "answer-structure",
    label: "FAQ section present",
    status: e.signals.faqPairs >= 3 ? "pass" : e.signals.faqPairs >= 1 ? "warn" : "fail",
    value: Math.min(1, e.signals.faqPairs / 4),
    weight: 5,
    engines: ["perplexity", "chatgpt", "google-aio"],
    evidence:
      e.signals.faqPairs > 0
        ? `${e.signals.faqPairs} question/answer pairs detected in the markup.`
        : "No FAQ markup or question/answer pairs found.",
    fix:
      e.signals.faqPairs < 3
        ? {
            summary: "Add a real FAQ block with FAQPage schema",
            detail:
              "Q&A pairs are the most directly extractable structure there is, and FAQPage JSON-LD is one of Perplexity's clearest preferences. " +
              "Use the questions people actually type, and answer each in 40–60 words.",
            effort: "small",
            generates: "jsonld",
          }
        : undefined,
  });

  checks.push({
    id: "comparison-tables",
    category: "answer-structure",
    label: "Tables and lists where they belong",
    status: e.signals.tables >= 1 || e.signals.lists >= 3 ? "pass" : e.signals.lists >= 1 ? "warn" : "fail",
    value: Math.min(1, (e.signals.tables * 2 + e.signals.lists) / 4),
    weight: 4,
    evidence: `${e.signals.tables} table(s), ${e.signals.lists} list(s).`,
    fix:
      e.signals.tables === 0 && e.signals.lists < 3
        ? {
            summary: "Convert comparisons to tables and processes to numbered lists",
            detail:
              "Comparison content is the single most-cited format in AI answers. A table is lifted whole; the same content in prose gets paraphrased or skipped.",
            effort: "small",
          }
        : undefined,
  });

  checks.push({
    id: "heading-hierarchy",
    category: "answer-structure",
    label: "Clean heading hierarchy",
    status: e.semantics.hierarchyOk && e.semantics.h1Count === 1 ? "pass" : "warn",
    value: e.semantics.hierarchyOk && e.semantics.h1Count === 1 ? 1 : 0.4,
    weight: 3,
    evidence: `${e.semantics.h1Count} H1, ${e.headings.length} headings total. Hierarchy ${e.semantics.hierarchyOk ? "does not skip levels" : "skips levels"}.`,
    fix:
      !e.semantics.hierarchyOk || e.semantics.h1Count !== 1
        ? {
            summary: "One H1, no skipped levels",
            detail:
              "The heading tree is how a parser decides which passage answers which question. Exactly one H1, then H2s under it, then H3s under those.",
            effort: "trivial",
          }
        : undefined,
  });

  // ---- Evidence density -----------------------------------------------------
  const per1k = e.html.textWords > 0 ? (e.signals.stats / e.html.textWords) * 1000 : 0;
  checks.push({
    id: "statistics-present",
    category: "evidence-density",
    label: "Specific figures in the copy",
    status: per1k >= 8 ? "pass" : per1k >= 3 ? "warn" : "fail",
    value: Math.min(1, per1k / 10),
    weight: 6,
    engines: ["claude", "perplexity", "chatgpt"],
    evidence: `${e.signals.stats} numeric values and ${e.signals.percentages} percentages across ${e.html.textWords} words (${per1k.toFixed(1)} per 1,000).`,
    fix:
      per1k < 8
        ? {
            summary: "Replace vague claims with numbers",
            detail:
              'Adding statistics measured a +37% visibility lift in the Princeton GEO study. "Significantly faster" is unquotable; ' +
              '"cuts setup from 40 minutes to 6" is a sentence an assistant can lift verbatim. Use figures you can actually stand behind.',
            effort: "medium",
            rewritable: true,
          }
        : undefined,
  });

  checks.push({
    id: "external-citations",
    category: "evidence-density",
    label: "Sources cited and linked",
    status: e.links.externalCitations >= 3 ? "pass" : e.links.externalCitations >= 1 ? "warn" : "fail",
    value: Math.min(1, e.links.externalCitations / 4),
    weight: 6,
    evidence:
      e.links.externalCitations > 0
        ? `Links out to ${e.links.externalCitations} distinct non-social domain(s): ${e.links.citationDomains.slice(0, 5).join(", ")}.`
        : "No outbound links to sources.",
    fix:
      e.links.externalCitations < 3
        ? {
            summary: "Cite the sources behind your claims",
            detail:
              "Citing sources was the highest-lift tactic in the Princeton GEO study (+40%), and up to +115% for lower-authority domains. " +
              "Link the original research, not a blog post summarising it.",
            effort: "small",
            rewritable: true,
          }
        : undefined,
  });

  checks.push({
    id: "quotes-attribution",
    category: "evidence-density",
    label: "Attributed quotes",
    status: e.signals.quotes >= 2 ? "pass" : e.signals.quotes >= 1 ? "warn" : "fail",
    value: Math.min(1, e.signals.quotes / 2),
    weight: 4,
    evidence: `${e.signals.quotes} quotation(s) or blockquote(s) found.`,
    fix:
      e.signals.quotes < 2
        ? {
            summary: "Add a named expert quote",
            detail:
              "Quotations measured a +30% lift. A quote with a name, title and organisation gives an assistant something attributable — " +
              "which is exactly what it needs to justify citing you.",
            effort: "medium",
          }
        : undefined,
  });

  return checks;
}
