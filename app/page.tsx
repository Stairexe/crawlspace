import type { Metadata } from "next";
import { getSpecimen } from "@/lib/demo";
import { FAQ } from "@/lib/faq";
import { LiveSpecimen } from "@/components/LiveSpecimen";
import { HomeClient } from "@/components/HomeClient";
import { LandingSections } from "@/components/LandingSections";
import { Descent } from "@/components/Descent";

// The specimen is a real audit, re-run when this page regenerates (at most daily).
export const revalidate = 86400;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const BASE = "https://crawlspace-geo.vercel.app";

export default async function Page() {
  const specimen = await getSpecimen();

  // The page's content genuinely changes when the specimen is re-run, so that run is its
  // modification date. If the specimen failed, no date is claimed.
  const modified = specimen.ok && specimen.report ? specimen.report.evidence.fetchedAt : undefined;

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${BASE}/#webpage`,
        url: BASE,
        name: "Crawlspace — can an AI assistant quote this page?",
        description:
          "A structural survey of one web page: crawler access, passage-by-passage citability, and five engine scores that are allowed to disagree.",
        ...(modified ? { dateModified: modified } : {}),
        author: { "@id": `${BASE}/#rohith` },
        publisher: { "@id": `${BASE}/#organization` },
        about: { "@id": `${BASE}/#app` },
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Descent />
      <HomeClient>
        <LandingSections specimen={<LiveSpecimen specimen={specimen} />} />
      </HomeClient>
    </>
  );
}
