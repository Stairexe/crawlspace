import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Motion } from "@/components/Motion";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://crawlspace-geo.vercel.app"),
  title: {
    default: "Crawlspace — GEO audits for ChatGPT, Claude, Perplexity and AI Overviews",
    template: "%s · Crawlspace",
  },
  description:
    "Crawlspace surveys a web page the way AI crawlers read it and scores it separately for ChatGPT, Claude, Perplexity, Copilot and Google AI Overviews.",
  authors: [{ name: "Rohith Reddy", url: "https://github.com/Stairexe" }],
  creator: "Rohith Reddy",
  keywords: [
    "GEO", "generative engine optimization", "AEO", "AI search", "SEO audit", "llms.txt",
    "AI crawlers", "GPTBot", "PerplexityBot", "ClaudeBot", "AI citations", "structured data", "JSON-LD"
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Crawlspace — see your site the way AI engines do",
    description:
      "Free GEO audit: crawler access, passage-by-passage citability, and five engine scores for ChatGPT, Claude, Perplexity, Copilot and Google AI Overviews.",
    type: "website",
    siteName: "Crawlspace",
  },
  twitter: { card: "summary_large_image" },
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
        "Crawlspace audits how crawlable and citable a web page is to AI assistants, one engine at a time.",
      founder: { "@id": `${BASE}/#rohith` },
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
      "@type": "Person",
      "@id": `${BASE}/#rohith`,
      name: "Rohith Reddy",
      url: "https://github.com/Stairexe",
      sameAs: ["https://www.linkedin.com/in/rohithreddyasodi", "https://github.com/Stairexe"],
    },
  ],
};

// Runs before first paint. Marks JS as present so [data-reveal] can start hidden for GSAP,
// and un-hides it after 3s if the motion layer never loads — the page can never stay blank.
const HEAD_SCRIPT = `(function(){var d=document.documentElement;d.setAttribute("data-js","");setTimeout(function(){if(!d.hasAttribute("data-motion"))d.setAttribute("data-reveal-fallback","")},3000)})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <body className="text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Motion />
      </body>
    </html>
  );
}
