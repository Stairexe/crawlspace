import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShared } from "@/lib/accounts";
import { SharedReport } from "@/components/SharedReport";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ shareId: string }> };

async function load(shareId: string) {
  try {
    return await getShared(shareId);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  const saved = await load(shareId);
  const title = saved ? `Audit of ${saved.summary.host}` : "Report not found";
  // Shared reports are someone's private work made viewable, not pages for search.
  return { title, robots: { index: false, follow: false } };
}

export default async function PublicReportPage({ params }: Props) {
  const { shareId } = await params;
  const saved = await load(shareId);
  if (!saved) notFound();
  return <SharedReport report={saved.report} sharedAt={saved.summary.createdAt} />;
}
