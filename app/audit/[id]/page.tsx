"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AuditRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/dashboard?domain=${encodeURIComponent(id)}&tab=audit`);
    }
  }, [id, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8 mono text-ink-faint">
      Loading audit report for {id}…
    </div>
  );
}
