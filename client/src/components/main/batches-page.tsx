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
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { handleDownloadZip } from "@/actions";
// Define types for batch and image

const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes === 0) return "0B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));

  return `${(sizeInBytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

export default function BatchesPage({ batches }: { batches: Batch[] }) {
  const router = useRouter();

  const handleViewBatch = (batchId: string) => {
    router.push(`/results/${batchId}`);
  };

  const handleDownloadCSV = (batch: Batch) => {
    if (!("images" in batch) || batch.imagesCount === 0) {
      toast.error("No metadata available to download.");
      return;
    }

    // Define CSV headers
    // let csvContent = "data:text/csv;charset=utf-8,Title,Description,Keywords\n";

    // Append image metadata
    // batch.images.forEach((item) => {
    //   const title = `"${item.metadata.title.replace(/"/g, '""')}"`; // Escape quotes
    //   const description = `"${item.metadata.description.replace(/"/g, '""')}"`;
    //   const keywords = `"${item.metadata.keywords.join(", ")}"`;
    //   csvContent += `${title},${description},${keywords}\n`;
    // });

    // Create a Blob and generate a download link
    // const encodedUri = encodeURI(csvContent);
    // const link = document.createElement("a");
    // link.setAttribute("href", encodedUri);
    // link.setAttribute("download", "image_metadata.csv");
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
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
      <div className="flex flex-col gap-4">
        {batches.map((batch) => (
          <Card key={batch._id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-1">
                <CardTitle>Batch {batch.batchId.substring(0, 8)}</CardTitle>
                <Badge variant={"outline"} className="text-base">
                  Total size: {formatFileSize(batch.totalSize)}
                </Badge>
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
                  {batch.imagesCount || 0}
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
                onClick={() => handleDownloadZip(batch.batchId)}
              >
                <File className="mr-2 h-4 w-4" />
                Export ZIP
              </Button>
              <Button
                size={"sm"}
                onClick={() => handleViewBatch(batch.batchId)}
                disabled={batch.imagesCount === 0}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Images ({batch.imagesCount || 0})
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
