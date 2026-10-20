"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrawlspaceLogo } from "./CrawlspaceLogo";
import { GitHubIcon, LinkedInIcon } from "./SocialIcons";
import { AsciiField } from "./AsciiField";

const HIDDEN = ["/dashboard", "/report/", "/audit/", "/login", "/signup"];

const COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/", label: "Page audit" },
      { href: "/site", label: "Site survey" },
      { href: "/compare", label: "Compare audits" },
      { href: "/logs", label: "Crawler log analyser" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/developers", label: "API reference" },
      { href: "/developers#mcp", label: "MCP server" },
      { href: "/developers#cli", label: "CLI" },
      { href: "/developers#action", label: "GitHub Action" },
      { href: "/tools", label: "Free tools" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/methodology", label: "Methodology" },
      { href: "/sample", label: "Sample report" },
      { href: "/glossary", label: "GEO glossary" },
      { href: "/alternatives", label: "Alternatives" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signup", label: "Create account" },
      { href: "/login", label: "Log in" },
      { href: "/account", label: "Account settings" },
      { href: "https://github.com/Stairexe/crawlspace", label: "Source code", external: true },
    ],
  },
];

export function Footer() {
  const pathname = usePathname() ?? "/";
  if (HIDDEN.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(p + "/")))) {
    return null;
  }

  return (
    <footer className="mt-24 border-t border-line">
      <div className="frame">
        {/* Brand row */}
        <div className="grid md:grid-cols-2">
          <div className="relative overflow-hidden border-b border-line px-6 py-10 md:border-r">
            <CrawlspaceLogo showTagline />
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-ink-dim">
              Crawlspace fetches a page the way an AI crawler does and reports, engine by engine,
              what an assistant can and cannot quote from it.
            </p>
            <AsciiField shape="terrain" accent className="absolute inset-x-0 bottom-0 h-24 w-full opacity-70" cell={8} />
            <div className="h-16" />
          </div>
          <div className="grid grid-cols-2 border-b border-line">
            <a
              href="https://github.com/Stairexe/crawlspace"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 border-b border-r border-line px-6 py-5 text-[14px] text-ink-dim transition-colors hover:bg-surface hover:text-ink"
            >
              <GitHubIcon className="h-4 w-4" /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/rohithreddyasodi"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 border-b border-line px-6 py-5 text-[14px] text-ink-dim transition-colors hover:bg-surface hover:text-ink"
            >
              <LinkedInIcon className="h-4 w-4" /> LinkedIn
            </a>
            <Link
              href="/developers"
              className="flex items-center gap-3 border-r border-line px-6 py-5 text-[14px] text-ink-dim transition-colors hover:bg-surface hover:text-ink"
            >
              <span className="mono text-[12px] text-signal">{"{ }"}</span> API docs
            </Link>
            <Link
              href="/methodology"
              className="flex items-center gap-3 px-6 py-5 text-[14px] text-ink-dim transition-colors hover:bg-surface hover:text-ink"
            >
              <span className="mono text-[12px] text-signal">§</span> Methodology
            </Link>
          </div>
        </div>

        {/* Link grid */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          {COLUMNS.map((col, ci) => (
            <div
              key={col.title}
              className={`border-b border-line ${ci % 2 === 0 ? "border-r" : ""} md:border-r ${ci === COLUMNS.length - 1 ? "md:border-r-0" : ""}`}
            >
              <div className="border-b border-line px-6 py-4 text-[14px] font-medium text-ink">{col.title}</div>
              <ul>
                {col.links.map((l) => (
                  <li key={l.href + l.label} className="border-b border-line last:border-b-0">
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="block px-6 py-3 text-[14px] text-ink-dim transition-colors hover:bg-surface hover:text-ink"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="block px-6 py-3 text-[14px] text-ink-dim transition-colors hover:bg-surface hover:text-ink"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal row */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          <div className="border-r border-line px-6 py-4 text-[13px] text-ink-faint">© {new Date().getFullYear()} Crawlspace</div>
          <Link href="/terms" className="border-line px-6 py-4 text-[13px] text-ink-dim hover:text-ink md:border-r">
            Terms of Service
          </Link>
          <Link href="/privacy" className="border-r border-t border-line px-6 py-4 text-[13px] text-ink-dim hover:text-ink md:border-t-0">
            Privacy Policy
          </Link>
          <div className="flex items-center gap-2 border-t border-line px-6 py-4 text-[13px] text-ink-dim md:border-t-0">
            <span className="h-1.5 w-1.5 rounded-full bg-good" /> Scores model citability, not citations
          </div>
        </div>
      </div>
    </footer>
  );
}
