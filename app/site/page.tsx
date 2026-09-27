import type { Metadata } from "next";
import { SiteSurvey } from "@/components/SiteSurvey";

export const metadata: Metadata = {
  title: "Site survey",
  description: "Survey up to 20 pages of a site from its sitemap: per-engine scores for each page and the defects that repeat across the site.",
  alternates: { canonical: "/site" },
};

export default function SitePage() {
  return <SiteSurvey />;
}
