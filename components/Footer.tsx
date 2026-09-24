"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrawlspaceLogo } from "./CrawlspaceLogo";

const HIDDEN = ["/dashboard", "/report/", "/audit/", "/login", "/signup"];

const COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Survey",
    links: [
      { href: "/", label: "Run a survey" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/methodology", label: "Methodology" },
      { href: "/#faq", label: "Questions" },
    ],
  },
  {
    title: "Record",
    links: [
      { href: "https://github.com/Stairexe/crawlspace", label: "Source on GitHub", external: true },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
  {
    title: "Surveyor",
    links: [
      { href: "https://github.com/Stairexe", label: "Rohith Reddy", external: true },
      { href: "https://www.linkedin.com/in/rohithreddyasodi", label: "LinkedIn", external: true },
      { href: "mailto:rohithreddyasodi@gmail.com", label: "Email", external: true },
    ],
  },
];

export function Footer() {
  const pathname = usePathname() ?? "/";
  if (HIDDEN.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(p + "/")))) {
    return null;
  }

  return (
    <footer className="border-t border-signal/40 bg-surface">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-1 border-x border-line sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="border-b border-line p-6 md:border-b-0 md:border-r">
            <CrawlspaceLogo size={30} showTagline />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ink-dim">
              Fetches one page the way an AI crawler does and reports, engine by engine,
              what an assistant can and cannot quote from it.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title} className="border-b border-line p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
              <div className="tb-label">{c.title}</div>
              <ul className="mt-3 space-y-2 text-[13px]">
                {c.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target={l.href.startsWith("http") ? "_blank" : undefined}
                        rel={l.label === "Rohith Reddy" ? "author noreferrer" : "noreferrer"}
                        className="nav-link text-ink-dim"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="nav-link text-ink-dim">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mono flex flex-col gap-2 border-x border-t border-line px-6 py-4 text-[11px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Crawlspace</span>
          <span className="max-w-lg sm:text-right">
            Scores model how citable a page is. They do not measure whether it is cited.
          </span>
        </div>
      </div>
    </footer>
  );
}
