"use client";

import { useEffect } from "react";

/**
 * Marks [data-reveal] and [data-draw] elements with data-inview once they scroll into
 * view. One observer for the whole app; a MutationObserver picks up elements that
 * mount later (route changes, results appearing). Reveals happen once and never undo.
 * Without JS, the CSS never hides anything (the rules are scoped to html[data-js]).
 */
export function RevealObserver() {
  useEffect(() => {
    const SELECTOR = "[data-reveal]:not([data-inview]), [data-draw]:not([data-inview])";
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.inview = "";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    const scan = () => document.querySelectorAll(SELECTOR).forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
