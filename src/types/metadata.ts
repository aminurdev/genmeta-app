export interface MetadataResult {
  id: string;
  fileName: string;
  title: string;
  description: string;
  keywords: string[];
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  imageUrl?: string;
}
