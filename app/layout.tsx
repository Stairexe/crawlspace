import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQ } from "@/lib/faq";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://crawlspace-geo.vercel.app"),
  title: {
    default: "Crawlspace — Website Visibility Intelligence & GEO Audit Command Center",
    template: "%s · Crawlspace",
  },
  description:
    "Audit your website's search fundamentals, AI citation readiness across ChatGPT, Claude, Perplexity, Copilot, and Google AI Overviews, robots crawler permissions, and structured data.",
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
    title: "Crawlspace — Website Visibility Intelligence",
    description:
      "One audit for search engines and AI. See how ready your website is for ChatGPT, Claude, Perplexity, and Google.",
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
        "The Website Visibility Command Center: audits search fundamentals, AI citability, crawler permissions, and structured data.",
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800,900&display=swap"
        />
      </head>
      <body className="grain font-geist text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
