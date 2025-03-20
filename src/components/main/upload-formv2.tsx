"use client";

import type React from "react";

import { useEffect, useState, useCallback } from "react";
import {
  Upload,
  X,
  ImageIcon,
  Settings,
  Loader2,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { getBaseApi, getAccessToken } from "@/services/image-services";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Response type definition
interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    userId: string;
    batchId: string;
    successfulImages: {
      imageName: string;
      imageUrl: string;
      size: number;
      metadata: {
        title: string;
        description: string;
        keywords: string[];
      };
    }[];
    failedImages: {
      filename: string;
      error: string;
    }[];
    remainingTokens: number;
  };
}

export default function UploadForm() {
  const [loading, setLoading] = useState(false);
  const [uploadingStarted, setUploadingStarted] = useState(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [failedUploads, setFailedUploads] = useState<
    { filename: string; error: string }[]
  >([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);

  // Settings with local storage persistence
  const [settings, setSettings] = useState(() => {
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
  });

  useEffect(() => {
    localStorage.setItem("imageSeoSettings", JSON.stringify(settings));
  }, [settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );

      // Check if adding new files would exceed the 100 file limit
      if (files.length + newFiles.length > 100) {
        alert(
          "Maximum 100 images allowed. Please remove some files before adding more."
        );
        return;
      }

      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      // Check if adding new files would exceed the 100 file limit
      if (files.length + newFiles.length > 100) {
        alert(
          "Maximum 100 images allowed. Please remove some files before adding more."
        );
        return;
      }

      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const handleGenerateMore = () => {
    setFiles([]);
    setShowModal(false);
    setUploadResponse(null);
    setProcessedCount(0);
    setProgress(0);
    setFailedUploads([]);
  };

  const cancelUpload = useCallback(async () => {
    // In a real implementation, you would abort the fetch requests
    setShowConfirmDialog(false);
    setShowModal(false);
    setLoading(false);
    setUploadingStarted(false);
    setUploadInProgress(false);

    // If you have an abort controller setup, you would trigger it here

    // Notify the user
    alert("Upload process canceled");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    const batchId = uuidv4();
    setLoading(true);
    setUploadingStarted(true);
    setShowModal(true);
    setProcessedCount(0);
    setProgress(0);
    setFailedUploads([]);
    setUploadInProgress(true);

    try {
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      // Create FormData with all files and metadata
      const formData = new FormData();

      // Append all files to the FormData object
      files.forEach((file) => {
        formData.append("images", file);
      });

      // Add batch ID and settings to the form data
      formData.append("batchId", batchId);
      formData.append("titleLength", settings.titleLength.toString());
      formData.append(
        "descriptionLength",
        settings.descriptionLength.toString()
      );
      formData.append("keywordCount", settings.keywordCount.toString());
      formData.append("totalExpectedFiles", files.length.toString());

      // Start upload with progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${baseApi}/test/upload/multiple`, true);
      xhr.setRequestHeader("authorization", `Bearer ${accessToken}`);

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const uploadProgress = Math.round((event.loaded / event.total) * 50); // Upload is first 50%
          setProgress(uploadProgress);
        }
      };

      // Handle completion
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: UploadResponse = JSON.parse(xhr.responseText);

            console.log("Upload response:", response);
            setUploadResponse(response);

            // Make sure we're correctly counting successful uploads
            if (response.data && response.data.successfulImages) {
              setProcessedCount(response.data.successfulImages.length);
            } else {
              setProcessedCount(0);
            }

            // Make sure we're correctly tracking failed uploads
            if (response.data && response.data.failedImages) {
              setFailedUploads(response.data.failedImages);
            } else {
              setFailedUploads([]);
            }

            setProgress(100);
          } catch (error) {
            console.error("Error parsing response:", error);
            setFailedUploads([
              {
                filename: "Response parsing error",
                error: "Failed to parse server response. Please try again.",
              },
            ]);
          }
        } else {
          // Handle error
          console.error("Upload failed:", xhr.status, xhr.statusText);
          console.error("Response text:", xhr.responseText);

          try {
            // Try to parse error response if it's JSON
            const errorResponse = JSON.parse(xhr.responseText);
            setFailedUploads([
              {
                filename: "Batch upload",
                error:
                  errorResponse.message ||
                  `Server error: ${xhr.status} ${xhr.statusText}`,
              },
            ]);
          } catch {
            setFailedUploads([
              {
                filename: "Batch upload",
                error: `Server error: ${xhr.status} ${xhr.statusText}`,
              },
            ]);
          }
        }

        setLoading(false);
        setUploadingStarted(false);
        setUploadInProgress(false);
      };

      // Handle errors
      xhr.onerror = () => {
        console.error("Network error during upload");
        setFailedUploads([
          {
            filename: "Network error",
            error:
              "Connection failed. Please check your internet connection and try again.",
          },
        ]);
        setLoading(false);
        setUploadingStarted(false);
        setUploadInProgress(false);
        setProgress(0);
      };

      // Start the upload
      xhr.send(formData);
    } catch (error) {
      console.error("Error initiating upload:", error);
      setFailedUploads([
        {
          filename: "Request failed",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      ]);
      setLoading(false);
      setUploadingStarted(false);
      setUploadInProgress(false);
    }
  };

  useEffect(() => {
    // Handle page unload during processing
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadInProgress) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [uploadInProgress]);

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-lg text-center ${
                  isDragging ? "border-primary bg-primary/5" : "border-border"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex relative flex-col items-center justify-center gap-4 p-8">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Drag and drop your images here
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse from your device
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="opacity-0 absolute w-full h-full inset-0 cursor-pointer"
                    id="file-upload"
                    onChange={handleFileChange}
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" variant="outline">
                      Select Images
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, PNG, GIF, WebP
                  </p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">
                      Selected Images ({files.length})
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearAllFiles}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {files.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                          <div className="relative w-full h-full">
                            {file.type.startsWith("image/") ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <img
                                  src={
                                    URL.createObjectURL(file) ||
                                    "/placeholder.svg"
                                  }
                                  alt={file.name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-xs mt-1 truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-medium">Metadata Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure how your SEO metadata will be generated
                  </p>
                </div>
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="title-length">Title Length</Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.titleLength} characters
                    </span>
                  </div>
                  <Slider
                    id="title-length"
                    min={30}
                    max={150}
                    step={1}
                    value={[settings.titleLength]}
                    onValueChange={(value) =>
                      setSettings({ ...settings, titleLength: value[0] })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 50-60 characters for optimal display in search
                    results
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="description-length">
                      Description Length
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.descriptionLength} characters
                    </span>
                  </div>
                  <Slider
                    id="description-length"
                    min={50}
                    max={250}
                    step={1}
                    value={[settings.descriptionLength]}
                    onValueChange={(value) =>
                      setSettings({ ...settings, descriptionLength: value[0] })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 150-160 characters for optimal display in
                    search results
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="keyword-count">Keyword Count</Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.keywordCount} keywords
                    </span>
                  </div>
                  <Slider
                    id="keyword-count"
                    min={5}
                    max={60}
                    step={1}
                    value={[settings.keywordCount]}
                    onValueChange={(value) =>
                      setSettings({ ...settings, keywordCount: value[0] })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 20-30 keywords for a balanced approach
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-center">
        <Button
          type="submit"
          disabled={files.length === 0 || loading}
          className="px-20"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating SEO Metadata
            </>
          ) : (
            "Generate SEO Metadata"
          )}
        </Button>
      </div>

      {/* Main Processing AlertDialog */}
      <AlertDialog
        open={showModal}
        onOpenChange={(open) => {
          // If trying to close and still loading, show confirmation dialog
          if (!open && uploadInProgress) {
            setShowConfirmDialog(true);
          } else if (!uploadInProgress) {
            // Only allow closing if not loading
            setShowModal(open);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-between">
              <AlertDialogTitle>
                {uploadInProgress ? "Processing Images" : "Upload Complete"}
              </AlertDialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => {
                  if (!uploadInProgress) {
                    setShowModal(false);
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </AlertDialogHeader>
          <div className="py-6">
            {uploadInProgress ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-sm mt-2">
                    {uploadingStarted ? (
                      <span>
                        Uploading files {Math.min(progress, 50)}% complete
                      </span>
                    ) : (
                      <span>
                        Processed: {processedCount} of {files.length}
                      </span>
                    )}
                    {failedUploads.length > 0 && (
                      <span className="text-destructive">
                        Failed: {failedUploads.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    {uploadingStarted
                      ? "Uploading files to server..."
                      : "Analyzing images and generating SEO metadata"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    This process may take several minutes for large batches
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="rounded-full bg-green-100 p-3 w-16 h-16 mx-auto flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">
                    Processing complete!
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {uploadResponse ? (
                      <>
                        {uploadResponse.data.successfulImages.length} of{" "}
                        {files.length} images processed successfully
                      </>
                    ) : (
                      <>
                        {processedCount} of {files.length} images processed
                        successfully
                      </>
                    )}
                  </p>
                  {failedUploads.length > 0 && (
                    <p className="mt-1 text-sm text-destructive">
                      {failedUploads.length} uploads failed
                    </p>
                  )}
                  {uploadResponse && (
                    <div className="mt-4 p-2 bg-primary/5 rounded-md">
                      <div className="flex justify-between items-center">
                        <p className="text-sm">
                          <span className="font-medium">Remaining tokens:</span>{" "}
                          {uploadResponse.data.remainingTokens}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDetails(!showDetails)}
                          className="flex items-center"
                        >
                          {showDetails ? "Hide" : "Show"} details
                          <ChevronRight
                            className={`ml-1 h-4 w-4 transition-transform ${
                              showDetails ? "rotate-90" : ""
                            }`}
                          />
                        </Button>
                      </div>

                      {showDetails && (
                        <div className="mt-2 space-y-2 text-left">
                          <p className="text-xs">
                            <span className="font-medium">Batch ID:</span>{" "}
                            {uploadResponse.data.batchId}
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">Status:</span>{" "}
                            <Badge
                              variant={
                                failedUploads.length > 0 ? "outline" : "default"
                              }
                              className="ml-1"
                            >
                              {failedUploads.length > 0
                                ? "Partial Success"
                                : "Complete"}
                            </Badge>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Failed uploads section */}
          {!uploadInProgress && failedUploads.length > 0 && (
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-2">Failed Uploads:</h4>
              <div className="max-h-32 overflow-y-auto text-sm">
                {failedUploads.map((fail, index) => (
                  <div
                    key={index}
                    className="py-1 border-b border-gray-100 last:border-0"
                  >
                    <p
                      className="font-medium ellipsis-clamp mb-1"
                      title={fail.filename}
                    >
                      {fail.filename}
                    </p>
                    <p
                      style={{
                        wordBreak: "break-word",
                      }}
                      className="text-xs text-destructive"
                    >
                      {fail.error}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!uploadInProgress && (
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateMore}
                className="sm:flex-1"
              >
                Process More Images
              </Button>
              <Button type="button" asChild className="sm:flex-1">
                <Link href={`/results`}>View Results</Link>
              </Button>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation AlertDialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Processing?</AlertDialogTitle>
          </AlertDialogHeader>
          <p>
            Are you sure you want to cancel the current upload? This will stop
            processing your images.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              No, continue processing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelUpload}
              className="bg-destructive hover:bg-destructive/90"
            >
              Yes, cancel upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
