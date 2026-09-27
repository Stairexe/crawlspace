import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tools",
  description: "Every Crawlspace tool: page survey, site survey, compare two surveys, AI crawler log analyser, the API, MCP server, CLI and GitHub Action, and a sample report.",
  alternates: { canonical: "/tools" },
};

const TOOLS = [
  { href: "/", name: "Page survey", body: "One URL, five engine scores, a fix-first plan and every defect with its evidence." },
  { href: "/site", name: "Site survey", body: "Up to 20 pages from the sitemap, site averages, and the defects that repeat on every page." },
  { href: "/compare", name: "Compare", body: "Load two surveys and see what improved, what regressed, and by how much per engine." },
  { href: "/logs", name: "Crawler log analyser", body: "Drop an access log and see which AI crawlers actually visit — read in your browser, never uploaded." },
  { href: "/developers", name: "API, MCP, CLI, Action", body: "Run surveys from code, from Claude or Cursor, from the terminal, or as a CI gate." },
  { href: "/sample", name: "Sample report", body: "A full survey of a real page, re-run daily and shown unedited." },
  { href: "/methodology", name: "Methodology", body: "Every weight, gate and rule the scores come from." },
  { href: "/glossary", name: "Glossary", body: "The terms of AI search, each defined in a sentence you could quote." },
  { href: "/alternatives", name: "Alternatives", body: "What the other audits and trackers do, and where each is stronger." },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-12">
      <div className="tb-label">Tools</div>
      <h1 className="mt-2 text-[clamp(34px,5vw,56px)] leading-[1.02]">Everything Crawlspace does.</h1>
      <div className="mt-10 grid border-l border-t border-line md:grid-cols-2">
        {TOOLS.map((t, i) => (
          <Link key={t.href} href={t.href} className="lift group border-b border-r border-line bg-surface/60 p-6">
            <div className="mono text-[11px] text-signal">{String(i + 1).padStart(2, "0")}</div>
            <h2 className="mt-2 text-[20px]">{t.name}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">{t.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
