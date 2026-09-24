"use client";

import Link from "next/link";
import { CrawlspaceLogo } from "./CrawlspaceLogo";

/**
 * The honest first state. This screen used to open on a fabricated audit of Stripe
 * plus four invented "recent scans"; nothing is shown now until a real audit has run.
 */
export function DashboardEmpty({
  value,
  onChange,
  onRun,
  isScanning,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  isScanning: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-void text-ink">
      <header className="flex h-16 items-center border-b border-line px-6">
        <Link href="/" className="hover:opacity-90">
          <CrawlspaceLogo size={28} />
        </Link>
        <span className="mono ml-3 border-l border-line pl-3 text-[11px] uppercase tracking-wider text-ink-faint">
          Surveys
        </span>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-20">
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          No surveys on file
        </p>
        <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight">
          Nothing has been inspected yet.
        </h1>
        <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-ink-dim">
          Enter a URL and Crawlspace will fetch it the way an AI crawler does, then report
          what it found — and what it could not reach.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRun();
          }}
          className="mt-7 flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://yoursite.com/the-page-you-care-about"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            aria-label="URL to audit"
            className="mono h-11 flex-1 rounded-lg border border-line bg-surface px-4 text-[13px] text-ink placeholder:text-ink-faint/60 focus:border-line-bright"
          />
          <button
            type="submit"
            disabled={isScanning || !value.trim()}
            className="mono h-11 shrink-0 rounded-lg bg-signal px-6 text-[12.5px] font-semibold text-void transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isScanning ? "inspecting…" : "Run survey"}
          </button>
        </form>

        <p className="mono mt-4 text-[11.5px] leading-relaxed text-ink-faint">
          Surveys are not saved yet — this list stays empty between visits until accounts
          ship. Export from the results screen to keep one.
        </p>
      </div>
    </div>
  );
}
