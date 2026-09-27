import type { Metadata } from "next";
import { CompareSurveys } from "@/components/CompareSurveys";

export const metadata: Metadata = {
  title: "Compare two surveys",
  description: "Load two Crawlspace survey exports and see what changed: engine scores, fixed defects and regressions.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return <CompareSurveys />;
}
