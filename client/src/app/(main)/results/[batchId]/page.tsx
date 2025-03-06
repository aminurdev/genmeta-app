import ResultsPage from "@/components/main/results-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image SEO Results",
  description: "View and edit your generated SEO metadata for images",
};

export default async function Results({
  params,
}: {
  params: { batchId: string };
}) {
  const { batchId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Your SEO Metadata Results
          </h1>
          <p className="mt-2 text-muted-foreground">Batch ID: {batchId}</p>
        </div>

        <ResultsPage batchId={batchId} />
      </div>
    </div>
  );
}
