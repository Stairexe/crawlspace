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
  const siteTitle = e.html.title || "Target Website";
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

According to Princeton GEO empirical research:
1. Direct assertions without deixis increase citation rate by +40%.
2. Adding numerical evidence and statistics increases citations by +37%.
3. Authoritative quotations lift citation by +30%.
4. Vague antecedent references ("As discussed above", "this tool", "our solution") trigger truncation penalties.

Here is an extract from our page that currently suffers from extractability penalties:
"""
${weakBlock ? weakBlock.text : "Our modern platform provides integrated solutions for businesses seeking high reliability and automated workflows."}
"""

TASK:
1. Rewrite this passage in 2 variations (one concise 50-word answer, one comprehensive 120-word explanation).
2. Ensure the entity subject is explicitly declared in the first 7 words.
3. Remove all ambiguous pronouns and passive relational phrasing.
4. Integrate realistic factual anchor hooks and clear quotation-friendly framing.`,
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
   - "Organization": with name, url, logo, and sameAs social verification links.
   - "WebSite": with url, name, and SearchAction potentialAction.
   - "BreadcrumbList": reflecting a logical 2-level hierarchy for ${targetUrl}.
   - "FAQPage": extracting 3 common user questions based on the page topic.
2. Return ONLY the JSON-LD inside a <script type="application/ld+json"> tag without explanation.
3. Validate that no syntax errors exist and all property names follow schema.org standard.`,
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
We want to allow AI Search Assistants to index and cite our content, while controlling brute-force training scrapers.

RULES TO ENFORCE:
1. Search Crawlers to explicitly ALLOW:
   - Googlebot (Google traditional & AI Overviews)
   - OAI-SearchBot (ChatGPT Search engine)
   - ClaudeBot (Anthropic search & citations)
   - PerplexityBot (Perplexity real-time indexing)
   - Bingbot (Microsoft Copilot & Bing search)
2. Training Scrapers to RESTRICT:
   - GPTBot (OpenAI training dataset ingestion)
   - CCBot (Common Crawl archive scraper)
3. Protect private directory endpoints: /admin/, /api/private/, /drafts/
4. Declare sitemap: ${e.sitemap.found ? "https://" + new URL(targetUrl).hostname + "/sitemap.xml" : "https://domain.com/sitemap.xml"}

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
- AI Search Crawler Status: ${report.visibility.crawlers}% Allowed
- Critical Findings Detected: ${report.findings.filter((f) => f.severity === "critical").length}
- Recommended Remediations: ${report.findings.slice(0, 3).map((f) => f.label).join("; ")}

MEMO STRUCTURE:
1. Executive Summary: Explain the shift from traditional Google rankings to AI synthesized citations (ChatGPT, Perplexity, Claude, Google AI Overviews).
2. The Visibility Gap: Why having good SEO no longer guarantees appearance in AI-generated answers.
3. Risk Assessment: What traffic and brand presence is at stake if competitors are cited instead.
4. Immediate 30-Day Action Plan: 3 high-leverage technical and content initiatives to execute immediately.

Keep the tone professional, urgent, data-grounded, and concise.`,
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

        <pre className="mono text-[12px] text-ink-dim leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto thin-scroll p-3 bg-surface/40 rounded-xl border border-line/50">
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
