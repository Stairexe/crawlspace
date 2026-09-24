import { redirect } from "next/navigation";

// This route used to offer a multi-page crawl ("max pages: 50") that the engine does not
// perform. Crawlspace surveys one page at a time; the survey form lives on the home page.
export default function NewAuditPage() {
  redirect("/");
}
