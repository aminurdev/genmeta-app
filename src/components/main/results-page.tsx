/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getAccessToken, getBaseApi } from "@/services/image-services";
import { handleDownloadCSV, handleDownloadZip } from "@/actions";
import ImageCard from "./image-card"; // Import the new component
import Link from "next/link";

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
  error?: string;
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

const countWords = (str: string) => {
  return str
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

const getMetadataLimits = () => {
  if (typeof window !== "undefined") {
    const savedSettings = localStorage.getItem("imageSeoSettings");
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          titleLength: 80,
          descriptionLength: 120,
          keywordCount: 45,
        };
  }
  return {
    titleLength: 80,
    descriptionLength: 120,
    keywordCount: 45,
  };
};

const metadataLimits = getMetadataLimits();

export default function ResultsPage({ batchId }: { batchId: string }) {
  const [results, setResults] = useState<ImageBatch>(emptyBatch);
  const [loading, setLoading] = useState(false);
  const [isPending, setIsPending] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    title: string;
    description: string;
    keywords: string[];
  }>({
    title: "",
    description: "",
    keywords: [],
  });
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  // New copy handlers for individual fields
  const handleCopyField = useCallback((text: string, fieldName: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedField(fieldName);
        toast(`${fieldName} copied to clipboard`);

        // Reset after 2 seconds
        setTimeout(() => {
          setCopiedField(null);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        toast("Could not copy to clipboard");
      });
  }, []);

  const handleDeleteDialogOpen = useCallback((imageId: string) => {
    setImageToDelete(imageId);
    setDeleteDialogOpen(true);
  }, []);

  const deleteImage = useCallback(async () => {
    if (!imageToDelete || !batchId) return;

    try {
      setLoading(true);
      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${baseAPi}/images/delete?imageId=${imageToDelete}&batchId=${batchId}`,
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
        images: prev.images.filter((item) => item._id !== imageToDelete),
      }));

      toast("Image deleted successfully");
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    } catch (error) {
      console.error("Error deleting image:", error);
      toast(error instanceof Error ? error.message : "Failed to delete image");
    } finally {
      setLoading(false);
    }
  }, [imageToDelete, batchId]);

  // Get the image to be deleted for the dialog
  const imageToDeleteData = useMemo(() => {
    return results.images.find((img) => img._id === imageToDelete);
  }, [imageToDelete, results.images]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="">
              <Link href="/results">
                <ArrowLeft className="h-5 w-10 inline-block text-primary" />
              </Link>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Generated Metadata</h1>
              <p className="text-gray-500 mt-1">
                Total: {results.images.length} images.
              </p>
            </div>
          </div>{" "}
          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => handleDownloadCSV(batchId)}
              disabled={results.images.length === 0}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
            <Button
              onClick={() => handleDownloadZip(batchId)}
              disabled={results.images.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Download ZIP
            </Button>
          </div>
        </div>
      </div>

      {/* Show Skeletons if Loading */}
      {isPending ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-24 w-24 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : results.images.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No images found in this batch.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {results.images.map((item) => (
            <Card key={item._id}>
              <ImageCard
                item={item}
                editingItem={editingItem}
                editData={editData}
                setEditData={setEditData}
                metadataLimits={metadataLimits}
                copiedField={copiedField}
                loading={loading}
                countWords={countWords}
                handleEdit={handleEdit}
                handleCancel={handleCancel}
                handleSave={handleSave}
                handleCopyField={handleCopyField}
                handleKeywordChange={handleKeywordChange}
                handleKeywordBlur={handleKeywordBlur}
                handleDeleteDialogOpen={handleDeleteDialogOpen}
              />
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {imageToDeleteData && (
            <div className="flex items-center gap-4 py-2">
              <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={imageToDeleteData.imageUrl || "/placeholder.svg"}
                  alt={imageToDeleteData.imageName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium ellipsis-clamp">
                  {imageToDeleteData.imageName}
                </p>
                <p className="text-sm text-muted-foreground ellipsis-clamp">
                  {imageToDeleteData.metadata.title}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteImage}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
