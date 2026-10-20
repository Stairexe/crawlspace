"use client";

import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import { CrawlspaceLogo } from "./CrawlspaceLogo";
import { useSession } from "./useSession";

/**
 * The dashboard with no audit on screen: a request field, and the history underneath so
 * earlier audits are one click away. Nothing is invented to fill the space.
 */
export function DashboardEmpty({
  value,
  onChange,
  onRun,
  isScanning,
  error,
  history,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  isScanning: boolean;
  error?: string | null;
  history?: React.ReactNode;
}) {
  const session = useSession();
  return (
    <div className="flex min-h-screen flex-col bg-void text-ink">
      <header className="border-b border-line bg-void/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1112px] items-center justify-between px-5">
          <Link href="/" className="rounded-md p-1">
            <CrawlspaceLogo />
          </Link>
          <div className="flex items-center gap-2">
            {session.user ? (
              <Link href="/account" className="btn-ghost">
                {session.user.name}
              </Link>
            ) : session.accounts ? (
              <>
                <Link href="/login?next=/dashboard" className="btn-ghost">
                  Log in
                </Link>
                <Link href="/signup?next=/dashboard" className="btn-quiet">
                  Sign up
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="frame w-full flex-1 px-5 py-14 sm:px-10">
        <div className="bracket">
          [ <b>dashboard</b> ]
        </div>
        <h1 className="mt-3 text-[clamp(28px,4vw,40px)]">
          {session.user ? `Welcome back, ${session.user.name.split(" ")[0]}` : "Audit a page"}
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-dim">
          Enter a URL and Crawlspace fetches it the way an AI crawler does, then reports what it found — and what
          it could not reach.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRun();
          }}
          className="mt-7 flex max-w-2xl items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-sm"
        >
          <Globe className="ml-2 h-4 w-4 shrink-0 text-ink-faint" />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="yoursite.com/the-page-you-care-about"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            aria-label="URL to audit"
            className="h-10 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint/70"
          />
          <button type="submit" disabled={isScanning || !value.trim()} className="btn-primary shrink-0">
            {isScanning ? "Auditing…" : "Audit"}
            {!isScanning && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
        {isScanning && <div className="relative mt-3 h-[3px] max-w-2xl overflow-hidden rounded-full bg-line sweep" />}
        {error && (
          <p role="alert" className="mt-3 max-w-2xl rounded-lg bg-tint-bad px-3 py-2 text-[13.5px] text-danger">
            {error}
          </p>
        )}

        {history && (
          <div className="mt-14">
            <h2 className="text-[20px]">History</h2>
            <div className="mt-4">{history}</div>
          </div>
        )}
      </div>
    </div>
  );
}
