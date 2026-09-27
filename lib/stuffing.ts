/**
 * Keyword stuffing, measured. The Princeton GEO study found stuffing reduced visibility
 * in generative answers by roughly 10%, the only tactic it tested that backfired.
 *
 * Stuffing shows up as the same content phrase repeated far more often than prose
 * repeats itself. We count three-word phrases (ignoring phrases made only of stop
 * words) across the page's content blocks and report the most repeated one.
 */
const STOP = new Set(
  "a an the and or but if of to in on at by for with from as is are was were be been it its this that these those you your we our they their he she his her not no so than then there here what which who how why when where can will just into over under about more most very also do does did have has had".split(
    " ",
  ),
);

export interface StuffingResult {
  words: number;
  phrase: string | null;
  count: number;
  /** Occurrences per 1,000 words. */
  rate: number;
}

export function measureStuffing(texts: string[]): StuffingResult {
  const counts = new Map<string, number>();
  let words = 0;
  for (const text of texts) {
    const toks = text
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    words += toks.length;
    for (let i = 0; i + 2 < toks.length; i++) {
      const tri = [toks[i], toks[i + 1], toks[i + 2]];
      const content = tri.filter((t) => !STOP.has(t) && !/^\d+$/.test(t));
      if (content.length < 2) continue;
      const key = tri.join(" ");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let phrase: string | null = null;
  let count = 0;
  for (const [k, v] of counts) {
    if (v > count) {
      phrase = k;
      count = v;
    }
  }
  return { words, phrase, count, rate: words ? (count / words) * 1000 : 0 };
}
