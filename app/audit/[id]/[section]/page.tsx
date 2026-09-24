import { redirect } from "next/navigation";

// /audit/<domain>/<section> opens that dashboard tab (unknown sections fall back to the
// overview inside the dashboard).
export default async function AuditSectionRedirect({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id, section } = await params;
  redirect(
    `/dashboard?domain=${encodeURIComponent(decodeURIComponent(id))}&tab=${encodeURIComponent(section)}`,
  );
}
