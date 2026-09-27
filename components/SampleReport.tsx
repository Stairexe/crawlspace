"use client";

import { useRouter } from "next/navigation";
import type { AuditReport } from "@/lib/types";
import { VisibilityDashboard } from "./VisibilityDashboard";

/** The full report UI over a real survey, read-only: rewrites need the visitor's own key. */
export function SampleReport({ report }: { report: AuditReport }) {
  const router = useRouter();
  return (
    <VisibilityDashboard
      report={report}
      ai={{ enabled: false, providers: [], userKey: "", provider: "anthropic" }}
      onReset={() => router.push("/")}
    />
  );
}
