"use client";

import type React from "react";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Upload,
  X,
  ImageIcon,
  Settings,
  Loader2,
  Trash2,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { getBaseApi, getAccessToken } from "@/services/image-services";
import { toast } from "sonner";
import type { UploadResponse, UserPlanData } from "@/types/metadata";
import { cn } from "@/lib/utils";

export default function UploadForm() {
  // Core states
  const [files, setFiles] = useState<File[]>([]);
  const [tokens, setTokens] = useState<UserPlanData | null>(null);

  // UI states
  const [isDragging, setIsDragging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [tabValue, setTabValue] = useState("upload");

  // Processing states
  const [loading, setLoading] = useState(false);
  const [uploadingStarted, setUploadingStarted] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isPending, setIsPending] = useState(true);
  const [progress, setProgress] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(
    null
  );

  // Dialog states
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [inSufficientTokenModal, setInSufficientTokenModal] = useState(false);

  // Result states
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
    null
  );
  const [failedUploads, setFailedUploads] = useState<
    { filename: string; error: string }[]
  >([]);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);

  // XHR reference for cancellation
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // New states for processing timeout
  const [processingTimeout, setProcessingTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [isProcessingTimeout, setIsProcessingTimeout] = useState(false);
  const MAX_PROCESSING_TIME = 1800000; // 30 minutes in milliseconds
  const WARNING_TIME = 900000; // 15 minutes in milliseconds
  const [showWarning, setShowWarning] = useState(false);

  // Fetch user tokens
  const fetchUserTokens = useCallback(async () => {
    try {
      setIsPending(true);
      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();
      const response = await fetch(`${baseAPi}/users/tokens`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user tokens");
      }

      const data = await response.json();
      setTokens(data.data);
      return data.data;
    } catch (error) {
      console.error("Error fetching user tokens:", error);
      toast.error("Could not load available tokens");
    } finally {
      setIsPending(false);
    }
  }, []);

  // Fetch tokens on mount
  useEffect(() => {
    fetchUserTokens();
  }, [fetchUserTokens]);

  // Save settings to local storage
  useEffect(() => {
    localStorage.setItem("imageSeoSettings", JSON.stringify(settings));
  }, [settings]);

  // Handle page unload during processing
  useEffect(() => {
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

  // Add useEffect for tracking processing time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (uploadInProgress) {
      timer = setInterval(() => {
        setProcessedCount((prev) => prev + 1);
      }, 1000);
    } else {
      setProcessedCount(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [uploadInProgress]);

  // Add useEffect for warning timeout
  useEffect(() => {
    let warningTimer: NodeJS.Timeout;
    if (processingStartTime && !showWarning) {
      warningTimer = setTimeout(() => {
        setShowWarning(true);
        toast.warning(
          "Processing is taking longer than usual. The process will continue, but you may want to check your internet connection.",
          {
            duration: 10000,
          }
        );
      }, WARNING_TIME);
    }
    return () => {
      if (warningTimer) clearTimeout(warningTimer);
    };
  }, [processingStartTime, showWarning]);

  // Derived state
  const hasInsufficientTokens = useMemo(() => {
    if (!tokens || files.length === 0) return false;
    return tokens.availableTokens < files.length;
  }, [tokens, files.length]);

  // Determine upload status for UI
  const uploadStatus = useMemo(() => {
    if (!uploadResponse) return "none";

    const totalFiles = files.length;
    const failedCount = failedUploads.length;

    if (failedCount === totalFiles) return "allFailed";
    if (failedCount > 0) return "partialSuccess";
    return "allSuccess";
  }, [uploadResponse, files.length, failedUploads.length]);

  // File management handlers
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const newFiles = Array.from(e.target.files).filter((file) =>
          file.type.startsWith("image/")
        );

        // Check if adding new files would exceed the 100 file limit
        if (files.length + newFiles.length > 100) {
          toast.error(
            "Maximum 100 images allowed. Please remove some files before adding more."
          );
          return;
        }

        setFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [files.length]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((files) => files.filter((_, i) => i !== index));
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files) {
        const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
          file.type.startsWith("image/")
        );

        // Check if adding new files would exceed the 100 file limit
        if (files.length + newFiles.length > 100) {
          toast.error(
            "Maximum 100 images allowed. Please remove some files before adding more."
          );
          return;
        }

        setFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [files.length]
  );

  // Click to open file dialog
  const triggerFileInput = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only trigger if the click is directly on the container, not on its children
      if (e.target === e.currentTarget && fileInputRef.current) {
        fileInputRef.current.click();
      }
    },
    []
  );

  // Upload handlers
  const handleGenerateMore = useCallback(() => {
    setFiles([]);
    setShowModal(false);
    setUploadResponse(null);
    setProcessedCount(0);
    setProgress(0);
    setFailedUploads([]);
    setFailedFiles([]);
  }, []);

  const cancelUpload = useCallback(() => {
    // Abort the XHR request if it exists
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    setShowConfirmDialog(false);
    setShowModal(false);
    setLoading(false);
    setUploadingStarted(false);
    setUploadInProgress(false);
    toast.info("Upload process cancelled");
  }, []);

  const handleFileUpload = useCallback(
    async (formData: FormData, isRegeneration = false) => {
      try {
        const baseApi = await getBaseApi();
        const accessToken = await getAccessToken();

        // Create XHR for progress tracking
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr; // Store reference for cancellation

        xhr.open("POST", `${baseApi}/images/upload/multiple`, true);
        xhr.setRequestHeader("authorization", `Bearer ${accessToken}`);

        // Set upload timeout to 1 hour
        xhr.timeout = 3600000;
        xhr.ontimeout = () => {
          toast.error(
            "The request timed out. Please try with fewer or smaller images."
          );
          setUploadInProgress(false);
          setLoading(false);
        };

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const uploadProgress = Math.round(
              (event.loaded / event.total) * 100
            );
            setProgress(uploadProgress);
          }
        };

        // Set up promise for completion
        const uploadPromise = new Promise<UploadResponse>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response: UploadResponse = JSON.parse(xhr.responseText);
                resolve(response);
              } catch {
                reject(new Error("Failed to parse server response"));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                if (
                  errorResponse.status === "error" &&
                  errorResponse.message === "invalid token"
                ) {
                  reject(
                    new Error(
                      "Authentication failed: Your session has expired. Please log in again."
                    )
                  );
                } else {
                  reject(
                    new Error(
                      errorResponse.message ||
                        `Server error: ${xhr.status} ${xhr.statusText}`
                    )
                  );
                }
              } catch {
                reject(
                  new Error(`Server error: ${xhr.status} ${xhr.statusText}`)
                );
              }
            }
          };

          xhr.onerror = () => {
            reject(
              new Error(
                "Server unavailable. Please check your internet connection and try again later."
              )
            );
          };

          xhr.onabort = () => {
            reject(new Error("Upload cancelled by user"));
          };
        });

        // Start the upload
        xhr.send(formData);

        // Wait for completion
        const response = await uploadPromise;

        // Start processing timeout after upload completes
        setProcessingStartTime(Date.now());
        setShowWarning(false);
        const timeout = setTimeout(() => {
          setIsProcessingTimeout(true);
          setUploadInProgress(false);
          setLoading(false);
          toast.error(
            "Processing has exceeded the maximum time limit. The process will continue in the background. You can check the results later.",
            {
              duration: 15000,
            }
          );
        }, MAX_PROCESSING_TIME);
        setProcessingTimeout(timeout);

        // Process upload response
        if (isRegeneration) {
          // For regeneration, merge with existing data
          const previousSuccessfulImages =
            uploadResponse?.data.successfulImages || [];
          const newSuccessfulImages = response.data.successfulImages;

          const mergedResponse = {
            ...response,
            data: {
              ...response.data,
              successfulImages: [
                ...previousSuccessfulImages,
                ...newSuccessfulImages,
              ],
            },
          };

          setUploadResponse(mergedResponse);

          // Update successful uploads count (add to existing count)
          const previousSuccessCount =
            uploadResponse?.data.successfulImages.length || 0;
          const newSuccessCount = response.data.successfulImages.length;
          setProcessedCount(previousSuccessCount + newSuccessCount);
        } else {
          setUploadResponse(response);
          setProcessedCount(response.data.successfulImages.length);
        }

        // Process failed uploads
        if (
          response.data.failedImages &&
          response.data.failedImages.length > 0
        ) {
          setFailedUploads(response.data.failedImages);

          // Store failed files for potential regeneration
          const filesToRegenerate = isRegeneration ? failedFiles : files;
          const newFailedFiles = filesToRegenerate.filter((file) =>
            response.data.failedImages.some(
              (failed) => failed.filename === file.name
            )
          );
          setFailedFiles(newFailedFiles);
        } else {
          setFailedUploads([]);
          setFailedFiles([]);
        }

        setProgress(100);
        xhrRef.current = null;
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        // Don't set failed uploads if it was a user cancellation
        if (errorMessage !== "Upload cancelled by user") {
          setFailedUploads([
            {
              filename: isRegeneration ? "Batch regeneration" : "Batch upload",
              error: errorMessage,
            },
          ]);
        }

        xhrRef.current = null;
        throw error;
      } finally {
        // Clear processing timeout
        if (processingTimeout) {
          clearTimeout(processingTimeout);
          setProcessingTimeout(null);
        }
        setIsProcessingTimeout(false);
        setProcessingStartTime(null);
        setShowWarning(false);
      }
    },
    [failedFiles, files, uploadResponse, processingTimeout]
  );

  // Add cleanup for processing timeout on component unmount
  useEffect(() => {
    return () => {
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }
    };
  }, [processingTimeout]);

  const regenerateFailedFiles = useCallback(async () => {
    if (failedFiles.length === 0) return;

    setIsRegenerating(true);
    setLoading(true);
    setUploadingStarted(true);
    setUploadInProgress(true);
    setProgress(0);

    // Use the failed files for regeneration
    const regenerateFiles = [...failedFiles];

    try {
      // Create FormData with failed files
      const formData = new FormData();

      // Append all failed files
      regenerateFiles.forEach((file) => {
        formData.append("images", file);
      });

      // Add batch ID and settings
      formData.append("batchId", uploadResponse?.data.batchId ?? "");
      formData.append("titleLength", settings.titleLength.toString());
      formData.append(
        "descriptionLength",
        settings.descriptionLength.toString()
      );
      formData.append("keywordCount", settings.keywordCount.toString());
      formData.append("totalExpectedFiles", regenerateFiles.length.toString());
      formData.append("isRegeneration", "true");

      await handleFileUpload(formData, true);
    } catch (error) {
      console.error("Error during regeneration:", error);
      if (
        error instanceof Error &&
        error.message !== "Upload cancelled by user"
      ) {
        toast.error("Failed to regenerate files");
        // Keep the failed files for potential retry
        setFailedFiles(regenerateFiles);
      }
    } finally {
      setLoading(false);
      setUploadingStarted(false);
      setUploadInProgress(false);
      setIsRegenerating(false);
    }
  }, [failedFiles, handleFileUpload, settings, uploadResponse?.data.batchId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (files.length === 0) {
        toast.error("Please upload at least one image");
        return;
      }

      // Check if user has enough tokens
      if (hasInsufficientTokens) {
        setInSufficientTokenModal(true);
        return;
      }

      // Setup UI state
      setLoading(true);
      setUploadingStarted(true);
      setShowModal(true);
      setProcessedCount(0);
      setProgress(0);
      setFailedUploads([]);
      setFailedFiles([]);
      setUploadInProgress(true);

      try {
        // Create FormData with all files and metadata
        const formData = new FormData();

        // Append all files
        files.forEach((file) => {
          formData.append("images", file);
        });

        // Append settings
        formData.append("titleLength", settings.titleLength.toString());
        formData.append(
          "descriptionLength",
          settings.descriptionLength.toString()
        );
        formData.append("keywordCount", settings.keywordCount.toString());
        formData.append("totalExpectedFiles", files.length.toString());

        await handleFileUpload(formData);
      } catch (error) {
        console.error("Error initiating upload:", error);
        if (
          error instanceof Error &&
          error.message !== "Upload cancelled by user"
        ) {
          toast.error("Upload failed. Please try again.");
        }
      } finally {
        setLoading(false);
        setUploadingStarted(false);
        setUploadInProgress(false);
      }
    },
    [files, handleFileUpload, hasInsufficientTokens, settings]
  );

  // Renderers for different UI sections
  const renderFileGrid = useCallback(() => {
    if (files.length === 0) return null;

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center">
            Selected Images
            <Badge variant="secondary" className="ml-2">
              {files.length}
            </Badge>
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAllFiles}
            className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[400px] overflow-y-auto overflow-x-hidden p-1">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg border bg-background/50 backdrop-blur-sm flex items-center justify-center overflow-hidden transition-all hover:shadow-md group-hover:border-primary/50">
                <div className="relative w-full h-full">
                  {file.type.startsWith("image/") ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={file.name}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
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
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 transition-transform"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-xs mt-1 ellipsis-clamp" title={file.name}>
                {file.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }, [files, clearAllFiles, removeFile]);

  const renderTokenInfo = useCallback(() => {
    if (!tokens) return null;

    return (
      <div className="mb-4 flex justify-center items-center text-muted-foreground">
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-1">Available:</span>
            <span
              className={cn(
                "text-sm font-bold",
                hasInsufficientTokens ? "text-destructive" : "text-primary"
              )}
            >
              {tokens.availableTokens}
            </span>
          </div>
          <div className="w-px h-4 bg-border"></div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-1">Required:</span>
            <span
              className={cn(
                "text-sm font-bold",
                hasInsufficientTokens ? "text-destructive" : "text-primary"
              )}
            >
              {files.length}
            </span>
          </div>

          {hasInsufficientTokens && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="ml-1">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Not enough tokens available</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  }, [tokens, files.length, hasInsufficientTokens]);

  const renderErrorContent = useCallback(() => {
    let errorMessage = "An unknown error occurred";
    let errorIcon = <AlertCircle className="h-10 w-10 text-destructive" />;

    // Extract error message from failed uploads
    if (failedUploads.length > 0) {
      errorMessage = failedUploads[0].error;

      // Check for specific error types
      if (
        errorMessage.includes("invalid token") ||
        errorMessage.includes("Authentication failed")
      ) {
        errorMessage = "Your session has expired. Please log in again.";
        errorIcon = <XCircle className="h-10 w-10 text-destructive" />;
      } else if (
        errorMessage.includes("Server unavailable") ||
        errorMessage.includes("internet connection")
      ) {
        errorIcon = <AlertTriangle className="h-10 w-10 text-amber-500" />;
      }
    }

    return (
      <div className="space-y-6">
        <div className="rounded-full bg-destructive/10 p-4 w-20 h-20 mx-auto flex items-center justify-center">
          {errorIcon}
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-destructive">
            Processing Failed
          </p>
          <p className="mt-3 text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }, [failedUploads]);

  const renderProcessingContent = useCallback(() => {
    const elapsedTime = processingStartTime
      ? Math.floor((Date.now() - processingStartTime) / 1000)
      : 0;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const remainingMinutes = Math.floor(
      (MAX_PROCESSING_TIME - elapsedTime * 1000) / 60000
    );

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center">
          <div className="relative w-12 h-12">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>

            {/* Spinning inner ring */}
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
              style={{ animationDuration: "1.5s" }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>

          {/* Enhanced progress bar */}
          <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: `${progress}%`,
              }}
            ></div>
          </div>

          {progress === 100 && uploadInProgress ? (
            <div className="flex items-center justify-center mt-3 text-primary">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2 bg-primary rounded-full animate-bounce"
                    style={{
                      animationDelay: `${i * 150}ms`,
                      animationDuration: "1.4s",
                    }}
                  ></div>
                ))}
              </div>
              <span className="ml-2 text-sm font-medium">
                Generating metadata...
              </span>
            </div>
          ) : (
            <div className="flex justify-between text-sm mt-3">
              {uploadingStarted ? (
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
                  {isRegenerating ? "Regenerating" : "Uploading"} files{" "}
                  {Math.min(progress, 100)}% complete
                </span>
              ) : (
                <span>
                  Processed: {processedCount} of{" "}
                  {isRegenerating
                    ? (uploadResponse?.data.successfulImages.length || 0) +
                      failedFiles.length
                    : files.length}
                </span>
              )}
              {failedUploads.length > 0 && (
                <span className="text-destructive font-medium">
                  Failed: {failedUploads.length}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 bg-muted/30 p-2 rounded-lg border">
          <h4 className="text-sm font-medium flex items-center">
            <Info className="h-4 w-4 mr-2 text-primary" />
            {uploadingStarted
              ? isRegenerating
                ? "Regenerating failed files..."
                : progress === 100
                ? "Upload complete! Generating SEO metadata..."
                : "Uploading files to server..."
              : "Analyzing images and generating SEO metadata..."}
          </h4>

          <p className="text-xs text-muted-foreground">
            {isProcessingTimeout ? (
              <span className="text-destructive font-medium">
                Processing has exceeded the time limit but will continue in the
                background. You can check the results later.
              </span>
            ) : showWarning ? (
              <span className="text-warning font-medium">
                Processing is taking longer than usual. The process will
                continue, but you may want to check your internet connection.
              </span>
            ) : (
              <>
                This process may take few minutes depending on the batch size.
                {elapsedTime > 60 && (
                  <span className="block mt-1 font-medium text-warning">
                    Processing time: {minutes}m {seconds}s. Estimated time
                    remaining: {remainingMinutes}m. Please keep this window open
                    to ensure the process completes successfully.
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      </div>
    );
  }, [
    progress,
    uploadInProgress,
    uploadingStarted,
    processedCount,
    isRegenerating,
    uploadResponse?.data?.successfulImages?.length,
    failedFiles.length,
    failedUploads.length,
    files.length,
    processingStartTime,
    isProcessingTimeout,
    showWarning,
  ]);

  const renderCompletionContent = useCallback(() => {
    // Determine icon and message based on upload status
    let icon = <CheckCircle2 className="h-8 w-8 text-green-600" />;
    let statusColor = "bg-green-100";
    let statusText = "Processing complete!";
    let statusTextColor = "text-green-600";

    if (uploadStatus === "allFailed") {
      icon = <XCircle className="h-10 w-10 text-destructive" />;
      statusColor = "bg-red-100";
      statusText = "Processing failed";
      statusTextColor = "text-destructive";
    } else if (uploadStatus === "partialSuccess") {
      icon = <AlertTriangle className="h-10 w-10 text-amber-500" />;
      statusColor = "bg-amber-100";
      statusText = "Partially completed";
      statusTextColor = "text-amber-600";
    }

    return (
      <div className="space-y-6">
        <div
          className={`rounded-full ${statusColor} p-4 w-16 h-16 mx-auto flex items-center justify-center`}
        >
          {icon}
        </div>
        <div className="text-center">
          <p className={`text-xl font-semibold ${statusTextColor}`}>
            {statusText}
          </p>
          <p className="mt-3 text-muted-foreground">
            {uploadResponse ? (
              <>
                {uploadResponse.data.successfulImages.length} of {files.length}{" "}
                images processed successfully
              </>
            ) : (
              <>
                {processedCount} of {files.length} images processed successfully
              </>
            )}
          </p>
          {failedUploads.length > 0 && (
            <p className="mt-1 text-sm text-destructive">
              {failedUploads.length} uploads failed
            </p>
          )}
          {uploadResponse && (
            <div className="mt-4 py-2 px-4 bg-muted/50 rounded-lg border">
              <div className="flex justify-between items-center">
                <p className="text-sm">
                  <span className="font-medium">Remaining tokens:</span>{" "}
                  <span className="text-primary font-bold">
                    {uploadResponse.data.remainingTokens}
                  </span>
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
                <div className=" space-y-3 text-left">
                  <p className="text-xs">
                    <span className="font-medium">Batch ID:</span>{" "}
                    <span className="font-mono bg-background px-1.5 py-0.5 rounded text-xs">
                      {uploadResponse.data.batchId}
                    </span>
                  </p>
                  <p className="text-xs flex items-center">
                    <span className="font-medium mr-2">Status:</span>{" "}
                    <Badge
                      variant={
                        uploadStatus === "allSuccess" ? "default" : "outline"
                      }
                      className={cn(
                        uploadStatus === "allFailed"
                          ? "border-destructive text-destructive"
                          : uploadStatus === "partialSuccess"
                          ? "border-amber-500 text-amber-500"
                          : ""
                      )}
                    >
                      {uploadStatus === "allSuccess"
                        ? "Complete"
                        : uploadStatus === "partialSuccess"
                        ? "Partial Success"
                        : "Failed"}
                    </Badge>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [
    uploadResponse,
    files.length,
    processedCount,
    failedUploads.length,
    showDetails,
    uploadStatus,
  ]);

  const renderFailedUploads = useCallback(() => {
    if (failedUploads.length === 0) return null;

    return (
      <div className="border-t pt-4 ">
        <h4 className="text-sm font-medium mb-3 flex items-center">
          <XCircle className="h-4 w-4 mr-2 text-destructive" />
          Failed Uploads:
        </h4>
        <div className="max-h-28 overflow-y-auto text-sm rounded-lg border bg-destructive/5">
          {failedUploads.map((fail, index) => (
            <div
              key={index}
              className="py-2 px-3 border-b border-border/30 last:border-0"
            >
              <p
                className="font-medium ellipsis-clamp mb-1"
                title={fail.filename}
              >
                {fail.filename}
              </p>
              <p className="text-xs text-destructive break-words">
                {fail.error}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }, [failedUploads]);

  return (
    <div className="bg-gradient-to-br from-background to-muted/50 p-6 rounded-xl border shadow-sm">
      {/* Token info */}
      {renderTokenInfo()}

      {/* Loading state */}
      {isPending && (
        <div className="flex justify-center items-center mb-4">
          <div className="relative">
            <div className="h-8 w-8 rounded-full border-2 border-primary/30 animate-ping absolute inset-0 opacity-75"></div>
            <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs
          defaultValue="upload"
          className="w-full"
          value={tabValue}
          onValueChange={setTabValue}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <Card className="overflow-hidden border-dashed bg-background/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                {/* Drag and drop area */}
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl text-center transition-all p-8",
                    isDragging
                      ? "border-primary bg-primary/10 scale-[0.98]"
                      : "border-border hover:border-primary/50"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={(e) => triggerFileInput(e)}
                >
                  <div className="flex relative flex-col items-center justify-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="h-6 w-6 text-primary/50 " />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        Drag and drop your images here
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        or click to browse from your device
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      multiple
                      className="sr-only"
                      id="file-upload"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                    <Label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex h-10 items-center justify-center rounded-md bg-primary text-primary-foreground px-8 text-sm font-medium shadow hover:bg-primary/90 transition-colors mt-2"
                      onClick={(e) => e.stopPropagation()} // Stop propagation to prevent double triggering
                    >
                      Select Images
                    </Label>
                    <div className="text-xs text-muted-foreground mt-4 flex flex-col items-center">
                      <p className="mb-1">Supported formats: JPG, JPEG, PNG</p>
                      <p>Max image size 45MB. Max 100 images per batch.</p>
                    </div>
                  </div>
                </div>

                {/* File grid */}
                {renderFileGrid()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card className="bg-background/50 backdrop-blur-sm">
              <CardContent className="pt-6 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Metadata Settings</h3>
                    <p className="text-muted-foreground">
                      Configure how your SEO metadata will be generated
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label htmlFor="title-length" className="text-base">
                        Title Length
                      </Label>
                      <span className="text-sm font-medium bg-muted px-2 py-1 rounded-md">
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
                      className="py-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      Recommended: 50-60 characters for optimal display in
                      search results
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label htmlFor="description-length" className="text-base">
                        Description Length
                      </Label>
                      <span className="text-sm font-medium bg-muted px-2 py-1 rounded-md">
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
                        setSettings({
                          ...settings,
                          descriptionLength: value[0],
                        })
                      }
                      className="py-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      Recommended: 150-160 characters for optimal display in
                      search results
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label htmlFor="keyword-count" className="text-base">
                        Keyword Count
                      </Label>
                      <span className="text-sm font-medium bg-muted px-2 py-1 rounded-md">
                        {settings.keywordCount} keywords
                      </span>
                    </div>
                    <Slider
                      id="keyword-count"
                      min={10}
                      max={50}
                      step={1}
                      value={[settings.keywordCount]}
                      onValueChange={(value) =>
                        setSettings({ ...settings, keywordCount: value[0] })
                      }
                      className="py-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      Recommended: 20-30 keywords for a balanced approach
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <Button
            type="submit"
            disabled={files.length === 0 || loading || isPending}
            className="px-12 h-12 text-base font-medium rounded-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Metadata
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Metadata
              </>
            )}
          </Button>
        </div>

        {/* Processing AlertDialog */}
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex justify-between items-center">
                <AlertDialogTitle className="text-xl">
                  {uploadInProgress
                    ? "Processing Images"
                    : uploadStatus === "allSuccess"
                    ? "Upload Complete"
                    : uploadStatus === "partialSuccess"
                    ? "Partially Completed"
                    : failedUploads.length > 0 &&
                      failedUploads[0].error.includes("Server unavailable")
                    ? "Server Unavailable"
                    : failedUploads.length > 0 &&
                      (failedUploads[0].error.includes("invalid token") ||
                        failedUploads[0].error.includes("Authentication"))
                    ? "Authentication Error"
                    : "Upload Failed"}
                </AlertDialogTitle>
                {!uploadInProgress && (
                  <button
                    onClick={() => setShowModal(false)}
                    className="rounded-full p-1.5 transition-colors hover:bg-muted"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </AlertDialogHeader>
            <div className="py-4">
              {uploadInProgress
                ? renderProcessingContent()
                : uploadStatus === "allSuccess" ||
                  uploadStatus === "partialSuccess"
                ? renderCompletionContent()
                : renderErrorContent()}
            </div>

            {/* Failed uploads section - only show detailed failures if not a token/server error */}
            {!uploadInProgress &&
              uploadStatus !== "allSuccess" &&
              !failedUploads.some(
                (f) =>
                  f.error.includes("invalid token") ||
                  f.error.includes("Authentication") ||
                  f.error.includes("Server unavailable")
              ) &&
              renderFailedUploads()}

            {uploadInProgress ? (
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => setShowConfirmDialog(true)}
                  className="text-destructive border-destructive hover:text-destructive-foreground hover:bg-destructive/90"
                >
                  Cancel Upload
                </AlertDialogCancel>
              </AlertDialogFooter>
            ) : (
              <AlertDialogFooter className="flex flex-col sm:flex-row flex-wrap gap-2">
                {failedUploads.length > 0 &&
                  !failedUploads.some(
                    (f) =>
                      f.error.includes("invalid token") ||
                      f.error.includes("Authentication") ||
                      f.error.includes("Server unavailable")
                  ) && (
                    <Button
                      variant="secondary"
                      onClick={regenerateFailedFiles}
                      className="sm:flex-1"
                      disabled={isRegenerating}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Failed Files
                    </Button>
                  )}

                {/* For authentication errors, provide a login button */}
                {failedUploads.some(
                  (f) =>
                    f.error.includes("invalid token") ||
                    f.error.includes("Authentication")
                ) && (
                  <Button type="button" asChild className="sm:flex-1">
                    <Link href="/login">Log In Again</Link>
                  </Button>
                )}

                {/* For server unavailable errors, provide a retry button */}
                {failedUploads.some((f) =>
                  f.error.includes("Server unavailable")
                ) && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowModal(false);
                      setFailedUploads([]);
                    }}
                    className="sm:flex-1"
                  >
                    Try Again Later
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleGenerateMore}
                  className="sm:flex-1"
                >
                  Process More Images
                </Button>

                {uploadStatus !== "allFailed" && (
                  <Button type="button" asChild className="sm:flex-1">
                    <Link href="/results">
                      <span className="flex items-center">
                        View Results
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
                )}
              </AlertDialogFooter>
            )}
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Confirmation AlertDialog */}
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">
                Cancel Processing?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to cancel the current upload? This will stop
              processing your images and you may lose progress.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>No, continue processing</AlertDialogCancel>
              <AlertDialogAction
                onClick={cancelUpload}
                className="bg-destructive hover:bg-destructive/90"
              >
                Yes, cancel upload
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Insufficient Tokens Dialog */}
        <Dialog
          open={inSufficientTokenModal}
          onOpenChange={setInSufficientTokenModal}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Not Enough Tokens</DialogTitle>
              <DialogDescription>
                You don&apos;t have enough tokens to process all your images.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center mb-4 p-3 bg-amber-100 text-amber-800 rounded-lg">
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <p className="font-medium">Token Shortage</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Required:</span>
                  <span className="text-destructive font-bold">
                    {files.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Available:</span>
                  <span className="text-primary font-bold">
                    {tokens?.availableTokens || 0}
                  </span>
                </div>
              </div>
              <p className="mt-6 text-muted-foreground">
                Please upgrade your plan to get more tokens and continue
                processing your images.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setInSufficientTokenModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button asChild className="flex-1">
                <Link href="/pricing">
                  <span className="flex items-center">
                    Upgrade Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </div>
  );
}
