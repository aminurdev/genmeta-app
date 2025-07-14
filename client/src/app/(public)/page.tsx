import HomePage from "@/components/Home";
import { getLatestRelease } from "./download/page";

export default async function Home() {
  const data = await getLatestRelease();

  return <HomePage releaseInfo={data} />;
}
