"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrawlspaceLogo } from "./CrawlspaceLogo";

const LINKS = [
  { href: "/#method", label: "Method" },
  { href: "/#specimen", label: "Specimen" },
  { href: "/#schedule", label: "What is inspected" },
  { href: "/methodology", label: "Methodology" },
];

const HIDDEN = ["/dashboard", "/report/", "/audit/", "/login", "/signup"];

export function Navbar() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  if (HIDDEN.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(p + "/")))) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-signal/25 bg-void/92 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label="Crawlspace home" className="-ml-1 rounded-sm p-1">
          <CrawlspaceLogo size={34} landing />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 text-[13px] text-ink-dim md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="mono px-3 py-1.5 text-[12px] text-ink-dim transition-colors hover:text-ink">
            Sign in
          </Link>
          <Link href="/dashboard" className="btn-primary">
            Dashboard
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="mono flex h-9 items-center gap-2 rounded-[3px] border border-line bg-surface px-3 text-[11.5px] uppercase tracking-[0.12em] text-ink md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-line bg-surface px-5 py-4 md:hidden">
          <ul className="divide-y divide-line">
            {[...LINKS, { href: "/#faq", label: "Questions" }, { href: "/dashboard", label: "Dashboard" }, { href: "/login", label: "Sign in" }].map(
              (l, i) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} className="flex items-baseline gap-4 py-3 text-[15px] text-ink">
                    <span className="mono w-6 text-[11px] text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                    {l.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
