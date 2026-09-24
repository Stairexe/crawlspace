import { getSpecimen } from "@/lib/demo";
import { LiveSpecimen } from "@/components/LiveSpecimen";
import { HomeClient } from "@/components/HomeClient";

/**
 * Server component. It runs a real audit of the specimen URL and hands the rendered
 * result to the client shell, so the landing page's headline evidence is measured
 * output rather than authored numbers — and so it exists in the server HTML, which is
 * what this tool's own renders-without-JS gate checks for.
 */
export const revalidate = 86400; // re-survey the specimen once a day

export default async function Page() {
  const specimen = await getSpecimen();
  return <HomeClient specimen={<LiveSpecimen specimen={specimen} />} />;
}
