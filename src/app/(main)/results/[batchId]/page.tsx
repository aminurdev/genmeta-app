import ResultsPage from "@/components/main/results-page";

export default async function Results({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const batchId = (await params).batchId;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Metadata Results
          </h1>
          <p className="mt-2 text-muted-foreground">Batch ID: {batchId}</p>
        </div>

        <ResultsPage batchId={batchId} />
      </div>
    </div>
  );
}
