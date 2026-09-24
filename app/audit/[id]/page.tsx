import { redirect } from "next/navigation";

// /audit/<domain> opens the dashboard and surveys that domain. A server redirect, so
// there is no interim "Loading…" screen.
export default async function AuditRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard?domain=${encodeURIComponent(decodeURIComponent(id))}&tab=audit`);
}
