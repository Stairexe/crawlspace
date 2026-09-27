import type { Metadata } from "next";
import Link from "next/link";
import { getSpecimen } from "@/lib/demo";
import { SampleReport } from "@/components/SampleReport";

// A real survey, re-run when the page regenerates (at most daily). Never a mock-up.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Sample report",
  description:
    "A complete Crawlspace survey of a real page, re-run daily: five engine scores, the defect schedule, the fix-first plan, passages and the crawler's view.",
  alternates: { canonical: "/sample" },
};

export default async function SamplePage() {
  const specimen = await getSpecimen();
  const when = specimen.report
    ? new Date(specimen.report.evidence.fetchedAt).toLocaleString("en-GB", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "UTC",
      })
    : null;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-12">
      <div className="tb-label">Sample report</div>
      <h1 className="mt-2 text-[clamp(34px,5vw,56px)] leading-[1.02]">A real survey, unedited.</h1>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-dim">
        This is the full report for{" "}
        <a href={specimen.url} target="_blank" rel="noreferrer" className="mono text-[14px] text-ink underline underline-offset-4">
          {specimen.url.replace(/^https:\/\//, "")}
        </a>
        , produced by the same engine that surveys your page.
        {when ? <> It was last run on {when} UTC and is re-run at most once a day.</> : null} The page
        was chosen because it is well known, not because it scores well; whatever it scores is
        what is shown.
      </p>

      <div className="mt-10">
        {specimen.ok && specimen.report ? (
          <SampleReport report={specimen.report} />
        ) : (
          <div role="status" className="plate p-6">
            <div className="tb-label">Specimen unavailable</div>
            <p className="mt-2 text-[14.5px] text-ink">
              {specimen.reason ?? "The specimen could not be surveyed when this page was built."}
            </p>
            <p className="mt-2 text-[13.5px] text-ink-dim">
              Nothing is shown in its place. Survey any page yourself instead.
            </p>
            <Link href="/" className="btn-primary mt-4">
              Run a survey
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
