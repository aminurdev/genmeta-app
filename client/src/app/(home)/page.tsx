import { getLatestRelease } from "@/lib/release-info";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Workflow } from "@/components/landing/workflow";
import { Audience } from "@/components/landing/audience";
import { Scale } from "@/components/landing/scale";
import { FinalCta } from "@/components/landing/final-cta";

export default async function HomePage() {
  const release = await getLatestRelease();
  const downloadUrl = release?.downloadUrl;

  return (
    <>
      <Hero downloadUrl={downloadUrl} />
      <Features />
      <Workflow />
      <Audience />
      <Scale />
      <FinalCta downloadUrl={downloadUrl} />
    </>
  );
}
