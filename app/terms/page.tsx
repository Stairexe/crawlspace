import Link from "next/link";
import { CrawlspaceLogo } from "@/components/CrawlspaceLogo";
import { ShieldCheck, FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service · Crawlspace",
  description: "Terms and conditions for utilizing Crawlspace Website Visibility Intelligence.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:py-24 space-y-12">
      {/* Header */}
      <div className="space-y-4 border-b border-line pb-8">
        <Link
          href="/"
          className="mono inline-flex items-center gap-2 text-[12px] text-ink-dim hover:text-signal transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-signal/40 bg-signal/15 text-signal">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="mono text-[11px] uppercase tracking-wider text-signal font-bold">
              Legal & Compliance
            </span>
            <h1 className="text-[32px] font-bold text-ink sm:text-[40px] tracking-tight">
              Terms of Service
            </h1>
          </div>
        </div>
        <p className="text-[14.5px] text-ink-dim">
          Effective Date: September 6, 2026 • Last updated: September 2026
        </p>
      </div>

      {/* Content */}
      <div className="card glass-panel p-8 sm:p-10 space-y-8 text-[14.5px] leading-relaxed text-ink-dim">
        <section className="space-y-3">
          <h2 className="text-[18px] font-bold text-ink">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Crawlspace platform, website, or APIs (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[18px] font-bold text-ink">2. Permitted Diagnostic Use</h2>
          <p>
            Crawlspace provides website visibility intelligence, SEO auditing, and AI citation analysis. You may use our service to analyze publicly accessible websites that you own, operate, or have permission to inspect.
          </p>
          <p>
            You agree not to use the Service to conduct denial-of-service attacks, scrape prohibited endpoints, or reverse-engineer the proprietary scoring and weight matrices without authorization.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[18px] font-bold text-ink">3. SSRF and Crawler Politeness</h2>
          <p>
            Our crawler respects standard <code className="mono text-[13px] text-signal">robots.txt</code> protocols and enforces strict Server-Side Request Forgery (SSRF) restrictions. Requests targeting internal IP ranges (127.0.0.0/8, 10.0.0.0/8, 192.168.0.0/16) or non-standard HTTP ports will be automatically blocked by our gateway.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[18px] font-bold text-ink">4. Intellectual Property & Brand Marks</h2>
          <p>
            All content, brand marks, scoring heuristics, and software code related to Crawlspace are the intellectual property of Rohith Reddy and Crawlspace contributors. Generated audit reports and custom prompts created for your target domains are your property.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[18px] font-bold text-ink">5. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranty of any kind. While Crawlspace grounds its recommendations in published empirical research (including Princeton University GEO studies), we do not guarantee specific placement in third-party search engines or LLM citation results.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[18px] font-bold text-ink">6. Contact & Questions</h2>
          <p>
            For questions regarding these terms, contact Rohith Reddy at{" "}
            <a
              href="mailto:rohithreddyasodi@gmail.com"
              className="mono text-signal hover:underline font-semibold"
            >
              rohithreddyasodi@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
