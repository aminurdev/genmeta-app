import HomePage from "@/components/Home";
import { getLatestRelease } from "@/lib/release-info";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "GenMeta — AI Metadata Generator for Stock Images & Vectors",
  description:
    "Generate titles, descriptions, keywords and categories for stock images, vectors and videos with GenMeta. Batch process your files and prepare metadata for leading microstock platforms.",
  path: "/",
  keywords: [
    "AI metadata generator",
    "stock metadata generator",
    "microstock metadata generator",
    "AI keyword generator for stock photos",
    "stock photo keyword generator",
    "stock photo metadata generator",
    "Adobe Stock metadata generator",
    "Shutterstock keyword generator",
    "Freepik metadata generator",
  ],
});

export default async function Home() {
  const data = await getLatestRelease();

  return <HomePage releaseInfo={data} />;
}

