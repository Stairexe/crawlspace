"use client";

import Link from "next/link";

/**
 * Accounts are not built yet. Until Firebase is wired, these routes must not present a
 * credential form: the previous version accepted any email and password, waited 600ms,
 * and routed to the dashboard, while the reset link asserted that an email had been
 * sent. Collecting a password that goes nowhere invites people to type a real,
 * reused one. This page collects nothing.
 */
export function AuthPending({ mode }: { mode: "signin" | "signup" }) {
  const isSignup = mode === "signup";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          {isSignup ? "Registration" : "Sign in"} not open yet
        </p>
        <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight">
          Crawlspace doesn&apos;t have accounts yet.
        </h1>

        <p className="mt-4 text-[14.5px] leading-relaxed text-ink-dim">
          Everything the tool does today works without one. Audits run, the full report
          renders, and every survey exports as Markdown or JSON — no sign-in, no key, no
          limit.
        </p>
        <p className="mt-4 text-[14.5px] leading-relaxed text-ink-dim">
          Accounts are being built so surveys can be saved, compared over time and shared
          by link. Rather than show a form that accepts any password and stores nothing,
          this page waits until that is real.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="mono rounded-lg bg-signal px-4 py-2 text-[12.5px] font-semibold text-void transition-all hover:brightness-110"
          >
            Run a survey
          </Link>
          <Link
            href="/methodology"
            className="mono rounded-lg border border-line px-4 py-2 text-[12.5px] text-ink-dim transition-colors hover:border-line-bright hover:text-ink"
          >
            Read the methodology
          </Link>
        </div>
      </div>
    </div>
  );
}
