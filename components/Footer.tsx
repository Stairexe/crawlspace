"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrawlspaceLogo } from "./CrawlspaceLogo";
import { Mail, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "./SocialIcons";

export function Footer() {
  const pathname = usePathname();

  // Hide the marketing footer when in dashboard, audit, auth, or public shared report views
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
    <footer className="border-t border-line/80 bg-surface/30">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-5">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <CrawlspaceLogo size={28} showTagline />
            <p className="max-w-sm text-[13px] leading-relaxed text-ink-dim">
              The Website Visibility Command Center. Audit search engine fundamentals, AI citability across ChatGPT, Claude, Perplexity, Copilot, and Google AI Overviews, and generate turnkey remediation code.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="h-2 w-2 rounded-full bg-signal pulse-dot" />
              <span className="mono text-[11px] text-ink-faint">
                All systems operational • v1.2 GEO Spec
              </span>
            </div>

            {/* Author Social Links */}
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://github.com/Stairexe"
                target="_blank"
                rel="noreferrer"
                aria-label="Rohith Reddy GitHub"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-dim hover:text-signal hover:border-signal/40 transition-colors"
              >
                <GitHubIcon className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com/in/rohithreddyasodi"
                target="_blank"
                rel="noreferrer"
                aria-label="Rohith Reddy LinkedIn"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-dim hover:text-signal hover:border-signal/40 transition-colors"
              >
                <LinkedInIcon className="h-4 w-4" />
              </a>
              <a
                href="mailto:rohithreddyasodi@gmail.com"
                aria-label="Email Rohith Reddy"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-dim hover:text-signal hover:border-signal/40 transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
              <span className="mono text-[11.5px] text-ink-faint pl-1">
                Rohith Reddy
              </span>
            </div>
          </div>

          {/* Column: Intelligence */}
          <div>
            <h4 className="mono text-[11px] uppercase tracking-wider text-ink font-semibold">
              Analysis Layers
            </h4>
            <ul className="mt-3 space-y-2 text-[12.5px] text-ink-dim">
              <li>
                <Link href="/#analyze" className="hover:text-ink transition-colors">
                  SEO Fundamentals
                </Link>
              </li>
              <li>
                <Link href="/#analyze" className="hover:text-ink transition-colors">
                  GEO Citations
                </Link>
              </li>
              <li>
                <Link href="/#analyze" className="hover:text-ink transition-colors">
                  AI Crawler Center
                </Link>
              </li>
              <li>
                <Link href="/#analyze" className="hover:text-ink transition-colors">
                  Structured Data (Schema)
                </Link>
              </li>
              <li>
                <Link href="/#analyze" className="hover:text-ink transition-colors">
                  Robots.txt Translation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: Product */}
          <div>
            <h4 className="mono text-[11px] uppercase tracking-wider text-ink font-semibold">
              Product
            </h4>
            <ul className="mt-3 space-y-2 text-[12.5px] text-ink-dim">
              <li>
                <Link href="/dashboard" className="hover:text-ink transition-colors">
                  Visibility Dashboard
                </Link>
              </li>
              <li>
                <Link href="/audit/new" className="hover:text-ink transition-colors">
                  New Website Audit
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-ink transition-colors">
                  Full Methodology Spec
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-ink transition-colors">
                  Transparent Pricing
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-ink transition-colors">
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: Legal & Open Resources */}
          <div>
            <h4 className="mono text-[11px] uppercase tracking-wider text-ink font-semibold">
              Legal & Open Code
            </h4>
            <ul className="mt-3 space-y-2 text-[12.5px] text-ink-dim">
              <li>
                <Link href="/terms" className="hover:text-ink transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-ink transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Stairexe/crawlspace"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-ink transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-ink transition-colors">
                  Audit FAQ
                </Link>
              </li>
              <li>
                <a
                  href="mailto:rohithreddyasodi@gmail.com"
                  className="hover:text-ink transition-colors"
                >
                  Contact Author
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-line/60 pt-6 text-[12px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p className="mono">
            © {new Date().getFullYear()} Crawlspace. Engineered by{" "}
            <a
              href="https://github.com/Stairexe"
              target="_blank"
              rel="noreferrer"
              className="text-ink-dim underline decoration-line-bright underline-offset-4 hover:text-signal"
            >
              Rohith Reddy
            </a>
            .
          </p>
          <p className="max-w-md text-right leading-relaxed max-sm:text-left">
            Scores are an objective model of citability & crawlability, not a commercial guarantee of ranking.
          </p>
        </div>
      </div>
    </footer>
  );
}
