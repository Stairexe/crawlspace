import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Plain definitions of the terms in AI search and generative engine optimisation: citation crawlers, training crawlers, llms.txt, sameAs, extractability, gates and more.",
  alternates: { canonical: "/glossary" },
};

const BASE = "https://crawlspace-geo.vercel.app";

const TERMS_LD = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  "@id": `${BASE}/glossary#terms`,
  name: "Crawlspace glossary of AI search terms",
  url: `${BASE}/glossary`,
  publisher: { "@id": `${BASE}/#organization` },
  hasDefinedTerm: GLOSSARY.map((t) => ({
    "@type": "DefinedTerm",
    "@id": `${BASE}/glossary#${t.id}`,
    name: t.term,
    description: t.definition,
    inDefinedTermSet: `${BASE}/glossary#terms`,
  })),
};

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(TERMS_LD) }} />
      <div className="tb-label">Glossary</div>
      <h1 className="mt-2 text-[clamp(34px,5vw,56px)] leading-[1.02]">The words, defined.</h1>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-dim">
        {GLOSSARY.length} terms from AI search and from Crawlspace&apos;s own reports. Each
        definition starts with the answer, and where a claim comes from a source, the source is
        linked under it.
      </p>

      <nav aria-label="Terms" className="mt-8 flex flex-wrap gap-1.5">
        {GLOSSARY.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="chip">
            {t.term.replace(/ \(.*\)$/, "")}
          </a>
        ))}
      </nav>

      <dl className="mt-10 border-t border-signal">
        {GLOSSARY.map((t, i) => (
          <div
            key={t.id}
            id={t.id}
            className="grid scroll-mt-24 gap-x-8 gap-y-2 border-b border-line py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
          >
            <dt>
              <span className="mono block text-[11px] text-ink-faint" data-n={`T-${String(i + 1).padStart(2, "0")}`} aria-hidden />
              <span className="mt-1 block text-[18px] font-semibold leading-snug text-ink">{t.term}</span>
            </dt>
            <dd className="min-w-0">
              <p className="text-[14.5px] leading-relaxed text-ink-dim">{t.definition}</p>
              {(t.source || t.seeAlso) && (
                <p className="mono mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px]">
                  {t.source && (
                    <a href={t.source.url} target="_blank" rel="noreferrer" className="text-ink-faint underline underline-offset-4 hover:text-signal">
                      Source: {t.source.label}
                    </a>
                  )}
                  {t.seeAlso && (
                    <Link href={t.seeAlso.href} className="text-signal underline underline-offset-4">
                      {t.seeAlso.label} →
                    </Link>
                  )}
                </p>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">
          Survey a page
        </Link>
        <Link href="/methodology" className="btn-quiet">
          Read the methodology
        </Link>
      </div>
    </div>
  );
}
