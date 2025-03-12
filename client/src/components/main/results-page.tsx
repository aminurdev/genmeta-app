"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Download,
  Edit,
  Save,
  Copy,
  Trash,
  FileDown,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccessToken, getBaseApi } from "@/services/image-services";

// Type definitions
type ImageMetadata = {
  title: string;
  description: string;
  keywords: string[];
};

type Image = {
  _id: string;
  imageName: string;
  imageUrl: string;
  metadata: ImageMetadata;
  generatedAt: string;
};

type ImageBatch = {
  _id: string;
  batchId: string;
  userId: string;
  images: Image[];
  createdAt: string;
};

// Empty batch state
const emptyBatch: ImageBatch = {
  _id: "",
  batchId: "",
  userId: "",
  images: [],
  createdAt: "",
};

export default function ResultsPage({ batchId }: { batchId: string }) {
  const [results, setResults] = useState<ImageBatch>(emptyBatch);
  const [loading, setLoading] = useState(false);
  const [isPending, setIsPending] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editData, setEditData] = useState<ImageMetadata>({
    title: "",
    description: "",
    keywords: [],
  });

  // API Call functions with useCallback to prevent unnecessary recreations
  const fetchBatchImages = useCallback(async (batchId: string) => {
    try {
      setIsPending(true);
      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();
      const response = await fetch(`${baseAPi}/images/batch/${batchId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch batch images");
      }

      const data = await response.json();
      setResults(data.data);
      return data.data;
    } catch (error) {
      console.error("Error fetching batch images:", error);
      toast("Failed to fetch images. Please try again.");
      return emptyBatch;
    } finally {
      setIsPending(false);
    }
  }, []);

  // Fetch images when batchId changes
  useEffect(() => {
    if (batchId) {
      fetchBatchImages(batchId);
    }
  }, [batchId, fetchBatchImages]);

  // Edit handlers
  const handleEdit = useCallback((item: Image) => {
    setEditingItem(item._id);
    setEditData({
      title: item.metadata.title,
      description: item.metadata.description,
      keywords: [...item.metadata.keywords],
    });
  }, []);

  const handleCancel = useCallback(() => {
    setEditingItem(null);
  }, []);

  const handleKeywordChange = useCallback((value: string) => {
    setEditData((prev) => ({
      ...prev,
      keywords: [value], // Store the raw string temporarily
    }));
  }, []);

  const handleKeywordBlur = useCallback(() => {
    setEditData((prev) => ({
      ...prev,
      keywords: prev.keywords
        .join(",")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean), // Convert to array only when leaving the input field
    }));
  }, []);

  // API operations with useCallback
  const handleSave = useCallback(async () => {
    if (!editingItem) return;

    try {
      setLoading(true);
      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();
      const currentImage = results.images.find(
        (item) => item._id === editingItem
      );

      if (!currentImage) {
        throw new Error("Image not found");
      }

      await toast.promise(
        fetch(`${baseAPi}/images/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            batchId: results.batchId,
            imageId: editingItem,
            imageName: currentImage.imageName,
            updateData: editData,
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || "Failed to update image metadata"
            );
          }

          setResults((prev) => ({
            ...prev,
            images: prev.images.map((item) =>
              item._id === editingItem
                ? { ...item, metadata: { ...editData } }
                : item
            ),
          }));

          setEditingItem(null);
        }),
        {
          loading: "Updating image metadata...",
          success: "Image metadata updated successfully!",
          error: (error) =>
            error instanceof Error
              ? error.message
              : "Failed to update metadata",
        }
      );
    } catch (error) {
      console.error("Error updating image metadata:", error);
    } finally {
      setLoading(false);
    }
  }, [editingItem, editData, results]);

  const handleDownloadZip = useCallback(async () => {
    if (!batchId) return;

    try {
      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();

      // ✅ Add token directly to URL for instant download
      const downloadURL = `${baseAPi}/images/download/${batchId}?token=${accessToken}`;

      // ✅ Open in new tab for immediate download bar appearance
      window.open(downloadURL, "_blank");

      toast("ZIP file download started");
    } catch (error) {
      console.error("Error downloading ZIP:", error);
      toast(
        error instanceof Error ? error.message : "Failed to download images"
      );
    }
  }, [batchId]);

  const handleDownloadCSV = useCallback(() => {
    if (results.images.length === 0) {
      toast("No metadata available to download");
      return;
    }

    try {
      // Define CSV headers
      let csvContent =
        "data:text/csv;charset=utf-8,Title,Description,Keywords\n";

      // Append image metadata
      results.images.forEach((item) => {
        const title = `"${item.metadata.title.replace(/"/g, '""')}"`; // Escape quotes
        const description = `"${item.metadata.description.replace(
          /"/g,
          '""'
        )}"`;
        const keywords = `"${item.metadata.keywords.join(", ")}"`;
        csvContent += `${title},${description},${keywords}\n`;
      });

      // Create a download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `image_metadata_${batchId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast("CSV file downloaded successfully");
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast("Failed to generate CSV file");
    }
  }, [results.images, batchId]);

  const handleCopyMetadata = useCallback((text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast("Metadata copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        toast("Could not copy to clipboard");
      });
  }, []);

  const deleteImage = useCallback(async (imageId: string, batchId: string) => {
    try {
      setLoading(true);
      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${baseAPi}/images/delete?imageId=${imageId}&batchId=${batchId}`,
        {
          method: "DELETE",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete image");
      }

      setResults((prev) => ({
        ...prev,
        images: prev.images.filter((item) => item._id !== imageId),
      }));

      toast("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast(error instanceof Error ? error.message : "Failed to delete image");
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoized metadata for export dialog
  const exportMetadata = useMemo(() => {
    return JSON.stringify(
      results.images.map((item) => ({
        filename: item.imageName,
        title: item.metadata.title,
        description: item.metadata.description,
        keywords: item.metadata.keywords,
      })),
      null,
      2
    );
  }, [results.images]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/results">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Generated Metadata</h2>
            <p className="text-muted-foreground">
              {results.images.length} images processed successfully
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadCSV}
            disabled={results.images.length === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <Button
            onClick={handleDownloadZip}
            disabled={results.images.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
        </div>
      </div>

      {/* Show Skeletons if Loading */}
      {isPending ? (
        <div className="grid gap-6">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="overflow-hidden">
              <div className="grid md:grid-cols-[300px_1fr] gap-6">
                <Skeleton className="w-full h-48 md:h-full bg-muted" />
                <div className="p-6 pt-0 md:pt-6 md:pl-0 flex flex-col">
                  <CardHeader className="p-0 pb-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <Skeleton className="h-4 w-full my-2" />
                  <Skeleton className="h-4 w-5/6 my-2" />
                  <Skeleton className="h-4 w-2/3 my-2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : results.images.length === 0 ? (
        <Card className="p-6 text-center">
          <p>No images found in this batch.</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {results.images.map((item) => (
            <Card key={item._id} className="overflow-hidden">
              <div className="grid md:grid-cols-[300px_1fr] gap-6">
                <div className="aspect-video md:aspect-auto md:h-full bg-muted flex items-center justify-center p-2">
                  <img
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.metadata.title}
                    className="w-full h-full object-cover rounded-md"
                    loading="lazy"
                  />
                </div>

                <div className="p-6 pt-0 md:pt-6 md:pl-0 flex flex-col">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl ellipsis-clamp">
                          {item.imageName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Image metadata
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FileDown className="h-4 w-4" />
                              <span className="sr-only">Download options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                window.open(item.imageUrl, "_blank");
                                toast(`Downloading ${item.imageName}`);
                              }}
                            >
                              Download Image
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleCopyMetadata(
                                  JSON.stringify(
                                    {
                                      title: item.metadata.title,
                                      description: item.metadata.description,
                                      keywords: item.metadata.keywords,
                                    },
                                    null,
                                    2
                                  )
                                )
                              }
                            >
                              Copy Metadata
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            toast.promise(
                              new Promise((resolve, reject) => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this image?"
                                  )
                                ) {
                                  deleteImage(item._id, batchId)
                                    .then(resolve)
                                    .catch(reject);
                                } else {
                                  reject();
                                }
                              }),
                              {
                                loading: "Deleting image...",
                                success: "Image deleted successfully",
                                error: "Failed to delete image",
                              }
                            );
                          }}
                          disabled={loading}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {editingItem === item._id ? (
                    <div className="space-y-4 flex-1">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={editData.title}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Description
                        </label>
                        <Textarea
                          value={editData.description}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="mt-1 resize-none"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Keywords (comma separated)
                        </label>
                        <Textarea
                          value={editData.keywords.join(", ")}
                          onChange={(e) => handleKeywordChange(e.target.value)}
                          onBlur={handleKeywordBlur}
                          className="mt-1 resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1">
                      <div>
                        <h3 className="text-sm font-medium">Title</h3>
                        <p>{item.metadata.title}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium">Description</h3>
                        <p className="text-sm">{item.metadata.description}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium">Keywords</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.metadata.keywords.map((keyword, i) => (
                            <Badge key={i} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full"
            disabled={results.images.length === 0}
          >
            <Copy className="mr-2 h-4 w-4" />
            Export All Metadata
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Metadata</DialogTitle>
            <DialogDescription>
              Copy all metadata in JSON format or download as a file.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-96">
            <pre className="bg-muted p-4 rounded-md text-sm">
              {exportMetadata}
            </pre>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleCopyMetadata(exportMetadata)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
