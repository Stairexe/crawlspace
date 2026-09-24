import { getSpecimen } from "@/lib/demo";
import { LiveSpecimen } from "@/components/LiveSpecimen";
import { HomeClient } from "@/components/HomeClient";
import { LandingSections } from "@/components/LandingSections";
import { Descent } from "@/components/Descent";

// The specimen is a real audit, re-run when this page regenerates (at most daily).
export const revalidate = 86400;

export default async function Page() {
  const specimen = await getSpecimen();
  return (
    <>
      <Descent />
      <HomeClient>
        <LandingSections specimen={<LiveSpecimen specimen={specimen} />} />
      </HomeClient>
    </>
  );
}
