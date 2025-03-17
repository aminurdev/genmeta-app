"use client";
import { useRouter } from "next/navigation";
import {
  FileText,
  Eye,
  Calendar,
  File,
  Clock,
  ImageIcon,
  Pencil,
  Check,
  X,
} from "lucide-react";
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
import { fetchImageMetadata, handleDownloadZip } from "@/actions";
import { formatFileSize } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { getAccessToken, getBaseApi } from "@/services/image-services";

// Define types for batch and image
type Metadata = {
  imageName: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
};

// Editable Card Title component
function EditableCardTitle({
  batch,
  onRename,
}: {
  batch: Batch;
  onRename: (batchId: string, newName: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [batchName, setBatchName] = useState(batch.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setBatchName(batch.name);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!batchName.trim()) {
      handleCancel();
      return;
    }

    setIsLoading(true);
    try {
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${baseApi}/images/batch/update/${batch.batchId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ name: batchName }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update batch name");
      }
      const result = await response.json();
      batch.name = result.data.name;
      onRename(batch.batchId, batchName);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating batch name:", error);
      handleCancel();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <>
          <Input
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="max-w-sm  h-8"
            autoFocus
            disabled={isLoading}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={isLoading}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <CardTitle>{batchName}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export default function BatchesPage({
  batches: initialBatches,
}: {
  batches: Batch[];
}) {
  const router = useRouter();
  const [batches, setBatches] = useState(initialBatches);

  const handleViewBatch = (batchId: string) => {
    router.push(`/results/${batchId}`);
  };

  const handleRenameBatch = (batchId: string, newName: string) => {
    setBatches((prev) =>
      prev.map((batch) =>
        batch.batchId === batchId ? { ...batch, displayName: newName } : batch
      )
    );
  };

  const handleDownloadCSV = async (batch: Batch) => {
    const metadata = await fetchImageMetadata(batch.batchId);
    const csvRows = [
      "imageName,title,description,keywords",
      ...metadata.map(
        (item: Metadata) =>
          `"${item.imageName}","${item.metadata.title.replace(
            /"/g,
            '""'
          )}","${item.metadata.description.replace(
            /"/g,
            '""'
          )}","${item.metadata.keywords.join(", ")}"`
      ),
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `image_metadata_${batch.batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <EditableCardTitle batch={batch} onRename={handleRenameBatch} />
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
