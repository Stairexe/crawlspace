"use client";

import { useState } from "react";
import type { AuditReport } from "@/lib/types";
import { Copy, Check, Sparkles, Code2, FileText, Bot, ArrowUpRight, Zap } from "lucide-react";

interface SpecializedPromptsProps {
  report: AuditReport;
}

export function SpecializedPrompts({ report }: SpecializedPromptsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("geo-rewrite");

  const e = report.evidence;
  const targetUrl = e.finalUrl;
  const host = new URL(e.finalUrl).hostname;
  const origin = new URL(e.finalUrl).origin;
  const siteTitle = e.html.title || host;
  const weakBlock = report.weakestBlocks[0];

  const prompts = [
    {
      id: "geo-rewrite",
      title: "Princeton GEO Content Rewriter",
      category: "Content & Citations",
      icon: Sparkles,
      description: "Optimizes passages for ChatGPT, Claude, and Perplexity by eliminating vague pronouns and front-loading assertions.",
      generate: () => `You are an expert in Generative Engine Optimization (GEO) and AI content extractability.
I am optimizing the content on "${siteTitle}" (${targetUrl}) to maximize citation probability across ChatGPT, Claude, and Perplexity.

Background (Aggarwal et al., "GEO: Generative Engine Optimization", KDD 2024): citing sources, adding statistics and adding quotations each raised visibility in generative engine answers. Passages that open by pointing at earlier text ("As discussed above", "this tool") cannot be quoted on their own.

${weakBlock ? `Here is the passage from our page that Crawlspace scored weakest (${Math.round(weakBlock.scores.total * 100)}/100):
"""
${weakBlock.text}
"""` : "Crawlspace found no passage scoring below 75 on this page, so there is nothing specific to rewrite. Review the page's longest paragraphs using the rules below."}

TASK:
1. Rewrite this passage in 2 variations (one concise 40–60-word answer, one fuller explanation of up to 160 words).
2. Name the subject explicitly in the first sentence and state the main claim first.
3. Replace pronouns and references that point outside the passage with the thing they refer to.
4. Use ONLY facts already stated in the passage. Do not add statistics, citations, quotes, names or claims that are not there. If a figure or source would help, mark the spot with [SOURCE NEEDED] instead of inventing one.`,
    },
    {
      id: "schema-generator",
      title: "JSON-LD Schema Architect",
      category: "Structured Data",
      icon: Code2,
      description: "Generates production-grade Schema.org JSON-LD tailored to the audited page architecture.",
      generate: () => `You are a technical SEO and Knowledge Graph architect.
Generate a valid, fully corroborated Schema.org JSON-LD block for the webpage:
URL: ${targetUrl}
Title: ${siteTitle}
Meta Description: ${e.html.metaDescription || "None provided"}
Detected Headings: ${e.headings.slice(0, 5).map((h) => h.text).join(" | ")}

REQUIREMENTS:
1. Use an @graph array containing:
   - "Organization": with name, url, logo and sameAs. Use a clearly marked placeholder such as "https://REPLACE-WITH-YOUR-LOGO-URL" for any URL not given here; never guess one.
   - "WebSite": with url and name.
   - "BreadcrumbList": only for path segments actually present in ${targetUrl}.
   - "FAQPage": only if the page already shows visible questions with answers; use those exact questions and answers, never invented ones.
2. Use only facts given above. Do not invent names, dates, ratings, prices or authors.
3. Return ONLY the JSON-LD inside a <script type="application/ld+json"> tag without explanation.
4. Validate that no syntax errors exist and all property names follow the schema.org standard.`,
    },
    {
      id: "robots-crawler-policy",
      title: "AI Crawler Directives Policy",
      category: "Crawler Infrastructure",
      icon: Bot,
      description: "Constructs an enterprise-grade robots.txt separating search engines from training scrapers.",
      generate: () => `You are a web infrastructure and bot management specialist.
Write an optimal, enterprise-ready robots.txt file for "${targetUrl}".

OBJECTIVE:
We want AI assistants to be able to read and cite our content.

RULES TO ENFORCE:
1. Explicitly ALLOW the crawlers AI assistants use to find and cite pages:
   - Googlebot and Google-Extended (Google Search and its AI features)
   - OAI-SearchBot, ChatGPT-User and GPTBot (ChatGPT)
   - ClaudeBot, Claude-User and Claude-SearchBot (Claude)
   - PerplexityBot and Perplexity-User (Perplexity)
   - Bingbot (Bing and Microsoft Copilot)
2. CCBot (Common Crawl) may be disallowed: it feeds model training datasets, not live citations.
3. Keep every existing Disallow rule from our current robots.txt unless it blocks one of the crawlers above from public content.
4. ${e.sitemap.found ? `Declare the sitemap: ${origin}/sitemap.xml` : "We have no sitemap at /sitemap.xml yet; leave a commented placeholder line for it rather than inventing a URL."}

Our current robots.txt:
"""
${e.robots.rawText ?? "(none found)"}
"""

Provide the exact robots.txt file contents with explanatory comments for our DevOps team.`,
    },
    {
      id: "executive-brief",
      title: "Executive Visibility Gap Memo",
      category: "Leadership Deliverable",
      icon: FileText,
      description: "Generates a concise 1-page executive memo for engineering and marketing leadership.",
      generate: () => `You are a strategic marketing intelligence consultant.
Write a 1-page executive memo to the leadership team of ${new URL(targetUrl).hostname} regarding their Website Visibility Score.

AUDIT BENCHMARK DATA:
- Target URL: ${targetUrl}
- Overall Visibility Score: ${report.visibility.overall} / 100
- Traditional SEO Score: ${report.visibility.seo} / 100
- Generative Engine (GEO) Score: ${report.visibility.geo} / 100
- AI crawler access score: ${report.visibility.crawlers} / 100
- Critical Findings Detected: ${report.findings.filter((f) => f.severity === "critical").length}
- Recommended Remediations: ${report.findings.slice(0, 3).map((f) => f.label).join("; ")}

MEMO STRUCTURE:
1. Executive Summary: Explain the shift from traditional Google rankings to AI synthesized citations (ChatGPT, Perplexity, Claude, Google AI Overviews).
2. The Visibility Gap: Why having good SEO no longer guarantees appearance in AI-generated answers.
3. Risk Assessment: What traffic and brand presence is at stake if competitors are cited instead.
4. Immediate 30-Day Action Plan: 3 high-leverage technical and content initiatives to execute immediately.

Keep the tone professional and concise. Use only the audit data above: do not invent traffic, revenue, competitor names or percentages.`,
    },
  ];

  const activePrompt = prompts.find((p) => p.id === activeTab) || prompts[0];

  function copyPrompt(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="card glass-panel p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-signal" />
            <span className="mono text-[11px] uppercase tracking-wider text-signal font-bold">
              Specialized AI Prompt Studio
            </span>
          </div>
          <h2 className="text-[20px] font-bold text-ink mt-1">
            Tailored Remediation Prompts for {new URL(targetUrl).hostname}
          </h2>
          <p className="text-[13px] text-ink-dim mt-0.5">
            Pre-engineered prompts grounded in your audit results. Paste into ChatGPT, Claude, or Cursor to execute fixes instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="mono rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-[11px] font-semibold text-signal flex items-center gap-1.5">
            <Zap className="h-3 w-3" />
            Zero Configuration
          </span>
        </div>
      </div>

      {/* Prompt Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {prompts.map((p) => {
          const Icon = p.icon;
          const isSelected = activeTab === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveTab(p.id)}
              className={`rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-signal bg-signal/10 shadow-[0_0_15px_var(--color-signal-glow)]"
                  : "border-line bg-surface/50 hover:border-line-bright"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-4 w-4 ${isSelected ? "text-signal" : "text-ink-faint"}`} />
                <span className="mono text-[10px] uppercase tracking-wider text-ink-faint font-semibold">
                  {p.category}
                </span>
              </div>
              <h3 className="text-[13.5px] font-bold text-ink leading-snug">{p.title}</h3>
              <p className="text-[11.5px] text-ink-dim mt-1 line-clamp-2 leading-relaxed">
                {p.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Prompt Code Inspector */}
      <div className="rounded-2xl border border-line bg-void/90 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" />
            <span className="mono text-[12.5px] font-semibold text-ink">
              {activePrompt.title} · Ready for LLM Execution
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyPrompt(activePrompt.id, activePrompt.generate())}
              className="mono flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 text-[12px] font-bold text-void hover:brightness-110 shadow-[0_0_12px_var(--color-signal-glow)] transition-all"
            >
              {copiedId === activePrompt.id ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>

        <pre tabIndex={0} className="mono text-[12px] text-ink-dim leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto thin-scroll p-3 bg-surface/40 rounded-xl border border-line/50">
          {activePrompt.generate()}
        </pre>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11.5px] text-ink-faint">
          <span>
            Works seamlessly in ChatGPT 4o, Claude 3.5 Sonnet, Cursor, Perplexity, or Copilot.
          </span>
          <span className="mono text-signal">
            Customized with live findings from {new URL(targetUrl).hostname}
          </span>
        </div>
      </div>
    </div>
  );
}
