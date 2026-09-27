import type { Metadata } from "next";
import { PrintReport } from "@/components/PrintReport";

export const metadata: Metadata = {
  title: "Printable survey",
  robots: { index: false, follow: false },
};

export default function PrintPage() {
  return <PrintReport />;
}
