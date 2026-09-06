import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy · Crawlspace",
  description: "Privacy policy and zero-storage guarantee for Crawlspace.",
};

export default function PrivacyPage() {
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
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <span className="mono text-[11px] uppercase tracking-wider text-signal font-bold">
              Data Protection & Privacy
            </span>
            <h1 className="text-[32px] font-bold text-ink sm:text-[40px] tracking-tight">
              Privacy Policy
            </h1>
          </div>
        </div>
        <p className="text-[14.5px] text-ink-dim">
          Effective Date: September 6, 2026 • Zero Permanent Storage Guarantee
        </p>
      </div>

      {/* Content */}
      <div className="card glass-panel p-8 sm:p-10 space-y-8 text-[14.5px] leading-relaxed text-ink-dim">
        <section className="space-y-3">
          <h2 className="text-[18px] font-bold text-ink">1. Zero-Key & Zero-Storage Guarantee</h2>
          <p>
            Crawlspace is designed with privacy-first engineering. You do not need to provide an API key to audit any website. When you do supply an optional OpenAI or Anthropic API key for passage rewrites, that key is stored strictly in your browser&apos;s ephemeral <code className="mono text-[13px] text-signal">sessionStorage</code> and is never logged to our databases, server disks, or telemetry logs.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[18px] font-bold text-ink">2. Information We Process</h2>
          <p>
            When you run an audit, our server fetches the publicly accessible HTML, robots.txt, and sitemap files of the target URL you submitted. We extract semantic structure, metadata, Schema.org JSON-LD tags, and text passage lengths.
          </p>
          <p>
            We do not sell, rent, or monetize your submitted URLs or audit data to third-party data brokers or advertising networks.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[18px] font-bold text-ink">3. Analytics & Cookies</h2>
          <p>
            We do not use invasive third-party tracking cookies. Session state is maintained locally in your browser to power fast navigation across audit views.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[18px] font-bold text-ink">4. Data Security</h2>
          <p>
            All network communication with Crawlspace is encrypted via TLS 1.3. Outbound crawler requests use verified DNS resolution and strict IP filtering to ensure secure execution.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[18px] font-bold text-ink">5. Contact Information</h2>
          <p>
            For privacy inquiries, contact Rohith Reddy at{" "}
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
