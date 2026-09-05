import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/lib/faq";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://crawlspace-geo.vercel.app"),
  title: {
    default: "Crawlspace — does an AI assistant know how to quote your page?",
    template: "%s · Crawlspace",
  },
  description:
    "Crawlspace audits how crawlable and citable a page is to ChatGPT, Perplexity, Claude, Copilot and Google AI Overviews — scores each engine separately, and rewrites the paragraphs they cannot use.",
  keywords: [
    "GEO", "generative engine optimization", "AEO", "AI search", "llms.txt",
    "AI crawlers", "GPTBot", "PerplexityBot", "ClaudeBot", "AI citations",
  ],
  openGraph: {
    title: "Crawlspace — a GEO audit engine",
    description:
      "Point it at a URL. It scores how citable the page is to five AI engines, names the paragraphs they cannot lift, and rewrites them.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const BASE = "https://crawlspace-geo.vercel.app";

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "Crawlspace",
      url: BASE,
      description:
        "A generative engine optimisation audit tool that scores how citable a page is to AI assistants and rewrites the passages they cannot use.",
      founder: {
        "@type": "Person",
        name: "Asodi Rohith Reddy",
        url: "https://github.com/Stairexe",
        sameAs: ["https://www.linkedin.com/in/rohithreddyasodi"],
      },
      sameAs: ["https://github.com/Stairexe/crawlspace"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${BASE}/#app`,
      name: "Crawlspace",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: BASE,
      author: { "@id": `${BASE}/#organization` },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description:
        "Audits how crawlable and citable a web page is to ChatGPT, Perplexity, Claude, Copilot and Google AI Overviews, scoring each engine separately and rewriting the passages an assistant cannot lift.",
    },
    {
      "@type": "FAQPage",
      "@id": `${BASE}/#faq`,
      // Same array the home page renders — schema must describe visible content.
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain">
        {/* Crawlspace scores structured data, so it carries its own. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-line bg-void/80 backdrop-blur-xl">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
              <Link href="/" className="group flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="block h-2.5 w-2.5 rounded-[2px] bg-signal shadow-[0_0_14px_var(--color-signal-glow)] transition-transform group-hover:scale-125"
                />
                <span className="mono text-[15px] font-semibold tracking-tight">crawlspace</span>
              </Link>
              <nav className="mono flex items-center gap-6 text-[12px] text-ink-dim">
                <Link href="/methodology" className="transition-colors hover:text-ink">
                  methodology
                </Link>
                <a
                  href="https://github.com/Stairexe/crawlspace"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-ink"
                >
                  source
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-line/70">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-[12px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
              <p className="mono">
                Crawlspace — a GEO audit engine. Built by{" "}
                <a
                  href="https://github.com/Stairexe"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-dim underline decoration-line-bright underline-offset-4 transition-colors hover:text-signal"
                >
                  Rohith Reddy
                </a>
                .
              </p>
              <p className="max-w-md text-right leading-relaxed max-sm:text-left">
                Scores are a model of citability, not a promise of citation. Every weight is
                published on the methodology page.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
