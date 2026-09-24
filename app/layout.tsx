import type { Metadata } from "next";
import { Archivo, Martian_Mono } from "next/font/google";

// Archivo carries a width axis: 100 for body, stretched to 118-125 for plate titles.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

// Annotation face: addresses, agent names, scores, the title block.
const martian = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian",
  display: "swap",
});
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RevealObserver } from "@/components/RevealObserver";
import { FAQ } from "@/lib/faq";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://crawlspace-geo.vercel.app"),
  title: {
    default: "Crawlspace — a structural survey of any page, for AI assistants",
    template: "%s · Crawlspace",
  },
  description:
    "Crawlspace fetches a page the way an AI crawler does, measures every passage against what ChatGPT, Claude, Perplexity, Copilot and Google AI Overviews can quote, and issues five separate scores with a numbered defect schedule.",
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
    title: "Crawlspace — can an AI assistant quote this page?",
    description:
      "A structural survey of one web page: crawler access, passage by passage citability, and five engine scores that are allowed to disagree.",
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
        "Crawlspace audits how crawlable and citable a web page is to AI assistants, one engine at a time.",
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

const HEAD_SCRIPT = `(function(){var d=document.documentElement;d.setAttribute("data-js","");try{if(location.pathname==="/"&&!sessionStorage.getItem("cs-descent")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-descent","play")}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${martian.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint: marks JS as present, and opts this visit into the
            Descent only on the home page, once per session, never with reduced motion. */}
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
        <RevealObserver />
      </body>
    </html>
  );
}
