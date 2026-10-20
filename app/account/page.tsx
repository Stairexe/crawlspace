import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { listAudits, toPublic } from "@/lib/accounts";
import { AccountPanel } from "@/components/AccountPanel";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");
  let count = 0;
  let shared = 0;
  try {
    const rows = await listAudits(user.id);
    count = rows.length;
    shared = rows.filter((r) => r.shareId).length;
  } catch {
    /* storage hiccup: show the page without counts */
  }
  return <AccountPanel user={toPublic(user)} audits={count} shared={shared} />;
}
