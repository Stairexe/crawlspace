"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AuditSectionRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const section = params?.section as string;

  useEffect(() => {
    if (id && section) {
      router.replace(`/dashboard?domain=${encodeURIComponent(id)}&tab=${encodeURIComponent(section)}`);
    }
  }, [id, section, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8 mono text-ink-faint">
      Loading {section} analysis for {id}…
    </div>
  );
}
