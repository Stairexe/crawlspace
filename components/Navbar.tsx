"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrawlspaceLogo } from "./CrawlspaceLogo";

export function Navbar() {
  const pathname = usePathname();

  // Hide the marketing navbar when in dashboard, audit, auth, or public shared report views
  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/report/") ||
    pathname?.startsWith("/audit/") ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-void/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* Brand Logo */}
        <Link href="/" className="transition-opacity hover:opacity-90">
          <CrawlspaceLogo size={30} />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-ink-dim">
          <Link href="/#analyze" className="transition-colors hover:text-ink">
            What We Analyze
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-ink">
            How It Works
          </Link>
          <Link href="/methodology" className="transition-colors hover:text-ink">
            Methodology
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-ink">
            Pricing
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-ink">
            FAQ
          </Link>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="mono text-[12.5px] text-ink-dim transition-colors hover:text-ink px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="mono flex items-center gap-1.5 rounded-lg bg-signal px-3.5 py-1.5 text-[12.5px] font-bold text-void transition-all hover:brightness-110 shadow-[0_0_14px_var(--color-signal-glow)]"
          >
            <span>Dashboard</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
