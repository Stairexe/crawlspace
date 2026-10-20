"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Site-wide motion, driven by GSAP + ScrollTrigger:
 *   [data-reveal]        fades and rises in as it scrolls into view (batched, staggered)
 *   [data-split]         headline whose .reveal-line > span children lift out of a mask
 *   [data-count="72"]    counts up from 0 when it enters
 *   [data-bar="0.72"]    a bar that grows to that fraction of its track
 *
 * Content added later (audit results) is picked up by a MutationObserver. With reduced
 * motion, everything is simply shown. If this never runs, the <head> script's fallback
 * un-hides [data-reveal] after a few seconds, so the page can never stay blank.
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;
    let cleanup: (() => void) | null = null;
    const root = document.documentElement;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      root.setAttribute("data-motion", "");

      const triggers: ScrollTrigger[] = [];

      const scan = () => {
        // Reveals
        const reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-rv])"));
        reveals.forEach((el) => el.setAttribute("data-rv", ""));
        if (reduced) {
          gsap.set(reveals, { opacity: 1, y: 0 });
        } else if (reveals.length) {
          triggers.push(
            ...ScrollTrigger.batch(reveals, {
              start: "top 92%",
              once: true,
              onEnter: (batch) =>
                gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.07, overwrite: true }),
            }),
          );
        }

        // Split headlines
        document.querySelectorAll<HTMLElement>("[data-split]:not([data-rv])").forEach((el) => {
          el.setAttribute("data-rv", "");
          const lines = el.querySelectorAll<HTMLElement>(".reveal-line > span");
          if (reduced || !lines.length) return;
          const immediate = el.hasAttribute("data-split-now");
          gsap.from(lines, {
            yPercent: 105,
            duration: 1.05,
            ease: "power4.out",
            stagger: 0.09,
            delay: immediate ? 0.1 : 0,
            scrollTrigger: immediate ? undefined : { trigger: el, start: "top 88%", once: true },
          });
        });

        // Counters
        document.querySelectorAll<HTMLElement>("[data-count]:not([data-rv])").forEach((el) => {
          el.setAttribute("data-rv", "");
          const target = Number(el.dataset.count);
          if (!Number.isFinite(target) || reduced) return;
          const state = { v: 0 };
          el.textContent = "0";
          gsap.to(state, {
            v: target,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 95%", once: true },
            onUpdate: () => {
              el.textContent = String(Math.round(state.v));
            },
            onComplete: () => {
              el.textContent = String(target);
            },
          });
        });

        // Bars
        document.querySelectorAll<HTMLElement>("[data-bar]:not([data-rv])").forEach((el) => {
          el.setAttribute("data-rv", "");
          const f = Math.max(0, Math.min(1, Number(el.dataset.bar)));
          if (reduced) {
            el.style.transform = `scaleX(${f})`;
            return;
          }
          gsap.fromTo(
            el,
            { scaleX: 0 },
            {
              scaleX: f,
              transformOrigin: "left center",
              duration: 1.2,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 95%", once: true },
            },
          );
        });
      };

      scan();
      ScrollTrigger.refresh();

      let queued = false;
      observer = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          scan();
          ScrollTrigger.refresh();
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });

      cleanup = () => {
        triggers.forEach((t) => t.kill());
      };
    })().catch(() => {
      root.setAttribute("data-reveal-fallback", "");
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      cleanup?.();
    };
  }, [pathname]);

  return null;
}
