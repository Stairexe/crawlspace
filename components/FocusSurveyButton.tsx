"use client";

export function FocusSurveyButton() {
  return (
    <button
      type="button"
      className="btn-primary"
      onClick={() => {
        const input = document.getElementById("survey-url") as HTMLInputElement | null;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        input?.focus({ preventScroll: true });
      }}
    >
      Start a survey <span aria-hidden>↑</span>
    </button>
  );
}
