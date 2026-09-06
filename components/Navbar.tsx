"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrawlspaceLogo } from "./CrawlspaceLogo";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-ink-dim">
          <Link href="/#analyze" className="transition-colors hover:text-ink">
            What We Analyze
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-ink">
            How It Works
          </Link>
          <Link href="/methodology" className="transition-colors hover:text-ink">
            Methodology
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-ink">
            FAQ
          </Link>
        </nav>

        {/* Desktop Action CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="mono text-[12.5px] text-ink-dim transition-colors hover:text-ink px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="mono flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 text-[12.5px] font-bold text-void transition-all hover:brightness-110 shadow-[0_0_14px_var(--color-signal-glow)]"
          >
            <span>Dashboard</span>
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/dashboard"
            className="mono rounded-lg bg-signal px-3 py-1.5 text-[12px] font-bold text-void"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink hover:text-signal transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-line bg-surface/95 backdrop-blur-2xl px-5 py-6 md:hidden space-y-4 tab-transition">
          <nav className="flex flex-col space-y-3 text-[15px] font-medium text-ink-dim">
            <Link
              href="/#analyze"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-signal transition-colors"
            >
              What We Analyze
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-signal transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/methodology"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-signal transition-colors"
            >
              Methodology Spec
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-signal transition-colors"
            >
              Audit FAQ
            </Link>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-ink-faint hover:text-ink transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-ink-faint hover:text-ink transition-colors"
            >
              Privacy Policy
            </Link>
          </nav>

          <div className="pt-4 border-t border-line/80 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mono block w-full rounded-xl border border-line bg-surface py-2.5 text-center text-[13px] font-semibold text-ink"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="mono block w-full rounded-xl bg-signal py-2.5 text-center text-[13px] font-bold text-void shadow-[0_0_14px_var(--color-signal-glow)]"
            >
              Open Dashboard →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
