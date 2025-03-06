"use client";

import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { getAccessToken, getBaseApi } from "@/services/image-services";

// Mock data for demonstration - batches
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

export default function ResultsPage({ batchId }: { batchId: string }) {
  const [results, setResults] = useState<ImageBatch>({
    _id: "",
    batchId: "",
    userId: "",
    images: [],
    createdAt: "",
  });
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    keywords: [] as string[],
  });

  console.log(editData, editingItem);
  async function getBatchImages(batchId: string) {
    try {
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
      return data;
    } catch (error) {
      console.error("Error fetching batch images:", error);
      return [];
    }
  }

  useEffect(() => {
    if (batchId) {
      setLoading(true);
      getBatchImages(batchId).then((images) => {
        setResults(images.data);
        setLoading(false);
      });
    }
  }, [batchId]);

  const handleEdit = (item: Image) => {
    setEditingItem(item._id);
    setEditData({
      title: item.metadata.title,
      description: item.metadata.description,
      keywords: [...item.metadata.keywords],
    });
  };

  const handleSave = async () => {
    if (!editingItem) return;

    try {
      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();
      const response = await fetch(`${baseAPi}/images/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          batchId: results.batchId,
          imageId: editingItem,
          imageName: results.images.find((item) => item._id === editingItem)
            ?.imageName,
          updateData: editData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update image metadata");
      }

      const updatedImage = await response.json();

      if ("images" in results) {
        setResults({
          ...results,
          images: results.images.map((item) =>
            item._id === editingItem
              ? { ...item, metadata: { ...item.metadata, ...editData } }
              : item
          ),
        });
      }

      setEditingItem(null);
    } catch (error) {
      console.error("Error updating image metadata:", error);
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
  };

  const handleKeywordChange = (value: string) => {
    setEditData({
      ...editData,
      keywords: value
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k),
    });
  };

  const handleDownloadZip = async () => {
    if (!batchId) return;

    try {
      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();
      const response = await fetch(`${baseAPi}/images/download/${batchId}`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${accessToken}`,
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

  const handleDownloadCSV = () => {
    if (!("images" in results) || results.images.length === 0) {
      alert("No metadata available to download.");
      return;
    }

    // Define CSV headers
    let csvContent = "data:text/csv;charset=utf-8,Title,Description,Keywords\n";

    // Append image metadata
    results.images.forEach((item) => {
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

  const handleCopyMetadata = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const deleteImage = async (imageId: string, batchId: string) => {
    try {
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

      if ("images" in results) {
        setResults({
          ...results,
          images: results.images.filter((item) => item._id !== imageId),
        });
      }

      alert("Image deleted successfully");
      // Optionally refresh the UI by removing the image from state
    } catch (error) {
      console.error("Error deleting image:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

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
              {"images" in results ? results.images.length : 0} images processed
              successfully
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadCSV}>
            <FileText className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <Button onClick={handleDownloadZip}>
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
        </div>
      </div>

      {/* Show Skeletons if Loading */}
      {loading ? (
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
                              onClick={() =>
                                alert(`Download ${item.imageName}`)
                              }
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
                          onClick={() => deleteImage(item._id, batchId)}
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
                            setEditData({
                              ...editData,
                              title: e.target.value,
                            })
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
                            setEditData({
                              ...editData,
                              description: e.target.value,
                            })
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
                          className="mt-1 resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave}>
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
          <Button variant="outline" className="w-full">
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
              {JSON.stringify(
                "images" in results
                  ? results.images.map((item) => ({
                      filename: item.imageName,
                      title: item.metadata.title,
                      description: item.metadata.description,
                      keywords: item.metadata.keywords,
                    }))
                  : [],
                null,
                2
              )}
            </pre>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                handleCopyMetadata(
                  JSON.stringify(
                    "images" in results
                      ? results.images.map((item) => ({
                          filename: item.imageName,
                          title: item.metadata.title,
                          description: item.metadata.description,
                          keywords: item.metadata.keywords,
                        }))
                      : [],
                    null,
                    2
                  )
                )
              }
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
