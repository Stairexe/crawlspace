import type { Metadata } from "next";
import { LogAnalyser } from "@/components/LogAnalyser";

export const metadata: Metadata = {
  title: "AI crawler log analyser",
  description: "Drop a server access log and see which AI crawlers actually visit, which pages they fetch and what status they get. Runs in your browser; nothing is uploaded.",
  alternates: { canonical: "/logs" },
};

export default function LogsPage() {
  return <LogAnalyser />;
}
