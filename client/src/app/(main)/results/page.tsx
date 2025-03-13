import BatchesPage from "@/components/main/batches-page";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccessToken, getBaseApi } from "@/services/image-services";
import type { Metadata } from "next";

// Add this export to make the route dynamic
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SEO Metadata Batches",
  description: "View all your SEO metadata generation batches",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Image = {
  _id: string;
  imageName: string;
  imageUrl: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  generatedAt: string;
};

export type Batch = {
  _id: string;
  batchId: string;
  name: string;
  userId: string;
  imagesCount: number;
  totalSize: number;
  createdAt: string;
  status: string;
};

export default async function Results() {
  const fetchBatches = async (): Promise<Batch[] | null> => {
    try {
      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();
      const response = await fetch(`${baseAPi}/images/batches`, {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch batches");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const batches = await fetchBatches();
  console.log(batches);
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Your SEO Metadata Batches
          </h1>
          <p className="mt-2 text-muted-foreground">
            View and manage all your generated metadata
          </p>
        </div>

        {batches ? (
          batches.length > 0 ? (
            <BatchesPage batches={batches} />
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-2">No batches found</h2>
              <p className="text-muted-foreground">
                You haven&apos;t created any SEO metadata batches yet.
              </p>
            </div>
          )
        ) : (
          <>
            <Skeleton style={{ height: 80 }} className="mb-4" />
            <Skeleton style={{ height: 80 }} className="mb-4" />
            <Skeleton style={{ height: 80 }} className="mb-4" />
          </>
        )}
      </div>
    </div>
  );
}
