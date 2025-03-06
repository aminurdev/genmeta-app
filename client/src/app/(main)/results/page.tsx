import BatchesPage from "@/components/main/batches-page";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO Metadata Batches",
  description: "View all your SEO metadata generation batches",
};

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
  userId: string;
  images: Image[];
  createdAt: string;
  status: string;
};

export default async function Results() {
  const fetchBatches = async (): Promise<Batch[] | null> => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/v1/images/batches",
        {
          headers: {
            authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2JjNTVkMmJhMDRiMDc2MjU2MGQ1Y2QiLCJuYW1lIjoiQW1pbnVyIiwiZW1haWwiOiJhbWludXJhYWFAZ2FtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQxMDc2ODk2LCJleHAiOjE3NDExNjMyOTZ9.MbPgx2WlaX0K1N0oIDiJ4AY3tyczhD1t4wo2MhGvWRc",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch batches");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(error);
      return null;
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

        {batches && batches?.length ? (
          <BatchesPage batches={batches} />
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
