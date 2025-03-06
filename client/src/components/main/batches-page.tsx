"use client";
import { useRouter } from "next/navigation";
import { FileText, Eye, Calendar, File, Clock, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Batch } from "@/app/(main)/results/page";
import { getAccessToken, getBaseApi } from "@/services/image-services";
// Define types for batch and image

export default function BatchesPage({ batches }: { batches: Batch[] }) {
  const router = useRouter();

  const handleViewBatch = (batchId: string) => {
    router.push(`/results/${batchId}`);
  };

  const handleDownloadCSV = (batch: Batch) => {
    if (!("images" in batch) || batch.images.length === 0) {
      alert("No metadata available to download.");
      return;
    }

    // Define CSV headers
    let csvContent = "data:text/csv;charset=utf-8,Title,Description,Keywords\n";

    // Append image metadata
    batch.images.forEach((item) => {
      const title = `"${item.metadata.title.replace(/"/g, '""')}"`; // Escape quotes
      const description = `"${item.metadata.description.replace(/"/g, '""')}"`;
      const keywords = `"${item.metadata.keywords.join(", ")}"`;
      csvContent += `${title},${description},${keywords}\n`;
    });

    // Create a Blob and generate a download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "image_metadata.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadZIP = async (batchId: string) => {
    if (!batchId) return;
    const baseAPi = await getBaseApi();
    const accessToken = await getAccessToken();
    try {
      const response = await fetch(`${baseAPi}/images/download/${batchId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`, // Replace with actual token
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Downloaded ZIP is empty");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch_${batchId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading ZIP:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!batches.length) {
    return <div className="text-center p-8">No batches found</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-2xl font-bold mb-6">Your Image Batches</h1>
      <div className="flex flex-col-reverse gap-4">
        {batches.map((batch) => (
          <Card key={batch._id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>Batch {batch.batchId.substring(0, 8)}</CardTitle>
                {/* <Badge
                variant={
                  batch.status === "completed"
                    ? "default"
                    : batch.status === "processing"
                    ? "secondary"
                    : "default"
                }
              >
                {batch.status}
              </Badge> */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {formatDate(batch.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Images:</span>{" "}
                  {batch.images?.length || 0}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Batch ID:</span>{" "}
                  <span className="text-xs text-muted-foreground font-mono">
                    {batch.batchId}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 flex-wrap">
              <Button
                variant="outline"
                size={"sm"}
                onClick={() => handleDownloadCSV(batch)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size={"sm"}
                onClick={() => handleDownloadZIP(batch.batchId)}
              >
                <File className="mr-2 h-4 w-4" />
                Export ZIP
              </Button>
              <Button
                size={"sm"}
                onClick={() => handleViewBatch(batch.batchId)}
                disabled={batch.images?.length === 0}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Images ({batch.images?.length || 0})
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
