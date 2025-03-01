"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  XMarkIcon,
  ClipboardIcon,
  PencilIcon,
  CheckIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { v4 as uuidv4 } from "uuid";
import { getAccessToken } from "@/services/image-services";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebounce<T extends (...args: any[]) => unknown>(
  callback: T,
  delay: number
) {
  const timeoutRef = useMemo(
    () => ({ current: null as NodeJS.Timeout | null }),
    []
  );

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay, timeoutRef]
  );
}

interface MetadataResult {
  id: string;
  fileName: string;
  title: string;
  description: string;
  keywords: string[];
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  imageUrl?: string;
}

interface EditingState {
  id: string | null;
  field:
    | keyof Pick<MetadataResult, "title" | "description" | "keywords">
    | null;
}

interface MetadataLimits {
  titleLength: number;
  descriptionLength: number;
  keywordsCount: number;
  helpText?: string;
}

interface FileCounters {
  selected: number;
  processed: number;
  remaining: number;
  failed: number;
  inProgress: number;
}

const downloadCSV = (results: MetadataResult[]) => {
  const headers = ["Filename", "Title", "Description", "Keywords"];
  const csvContent = results.map((result) => [
    result.fileName,
    result.title,
    result.description,
    result.keywords.join(", "),
  ]);

  const csvString = [
    headers.join(","),
    ...csvContent.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "metadata_export.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const countWords = (str: string) => {
  return str
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<MetadataResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState>({
    id: null,
    field: null,
  });
  const [editValue, setEditValue] = useState("");
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [metadataLimits, setMetadataLimits] = useState<MetadataLimits>({
    titleLength: 90,
    descriptionLength: 90,
    keywordsCount: 25,
    helpText: "",
  });
  const [tempMetadataLimits, setTempMetadataLimits] = useState<MetadataLimits>({
    titleLength: 90,
    descriptionLength: 90,
    keywordsCount: 25,
    helpText: "",
  });

  // Memoized file counters
  const fileCounters = useMemo<FileCounters>(() => {
    const completedCount = results.filter(
      (r) => r.status === "completed"
    ).length;
    const failedCount = results.filter((r) => r.status === "failed").length;
    const processingCount = results.filter(
      (r) => r.status === "processing"
    ).length;
    const totalCount = files.length + results.length;

    return {
      selected: totalCount,
      processed: completedCount,
      failed: failedCount,
      inProgress: processingCount,
      remaining: files.length,
    };
  }, [files.length, results]);

  // Optimized preview generation
  const generatePreviews = useCallback(async (files: File[]) => {
    const newPreviews: { [key: string]: string } = {};
    await Promise.all(
      files.map(async (file) => {
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newPreviews[file.name] = preview;
      })
    );
    setPreviews((prev) => ({ ...prev, ...newPreviews }));
  }, []);

  useEffect(() => {
    if (files.length > 0) {
      generatePreviews(files);
    }
  }, [files, generatePreviews]);

  // Optimized file handlers
  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );
    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      setError(null);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFiles(Array.from(e.dataTransfer.files));
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(Array.from(e.target.files));
      }
    },
    [handleFiles]
  );

  // Optimized file processing
  const processFiles = useCallback(async () => {
    if (files.length === 0 || processing) return;

    setProcessing(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const batchId = uuidv4();

      // Process files one by one
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append("image", file);
          formData.append("batchId", batchId);
          formData.append("titleLength", metadataLimits.titleLength.toString());
          formData.append(
            "descriptionLength",
            metadataLimits.descriptionLength.toString()
          );
          formData.append(
            "keywordCount",
            metadataLimits.keywordsCount.toString()
          );

          const tempId = uuidv4();
          setResults((prev) => [
            ...prev,
            {
              id: tempId,
              fileName: file.name,
              title: "",
              description: "",
              keywords: [],
              status: "processing",
            },
          ]);

          const response = await fetch(
            "http://localhost:5000/api/v1/images/upload/single",
            {
              method: "POST",
              body: formData,
              headers: {
                authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || `Failed to process ${file.name}`);
          }

          if (result.success) {
            const { _id, image } = result.data;
            setResults((prev) =>
              prev.map((r) =>
                r.id === tempId
                  ? {
                      id: _id,
                      fileName: image.imageName,
                      title: image.metadata.title,
                      description: image.metadata.description,
                      keywords: image.metadata.keywords,
                      status: "completed",
                      imageUrl: image.imageUrl,
                    }
                  : r
              )
            );

            // Remove the processed file from the queue
            setFiles((prev) => prev.filter((f) => f.name !== file.name));
          }
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          setResults((prev) =>
            prev.map((r) =>
              r.fileName === file.name
                ? {
                    ...r,
                    status: "failed",
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  }
                : r
            )
          );
        }
      }
    } catch (err) {
      console.error("Error processing files:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessing(false);
    }
  }, [files, processing, metadataLimits]);

  // Replace the copyToClipboard implementation
  const copyToClipboard = useCallback(
    async (text: string, field: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopyStatus((prev) => ({ ...prev, [id + field]: true }));
        setTimeout(() => {
          setCopyStatus((prev) => {
            const newStatus = { ...prev };
            delete newStatus[id + field];
            return newStatus;
          });
        }, 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },
    []
  );

  // Use the debounced version for the actual copy function
  const debouncedCopy = useDebounce<
    (text: string, field: string, id: string) => Promise<void>
  >(copyToClipboard, 300);

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[fileToRemove.name];
      return newPreviews;
    });
  };

  const startEditing = (
    id: string,
    field: "title" | "description" | "keywords",
    value: string | string[]
  ) => {
    setEditing({ id, field });
    setEditValue(Array.isArray(value) ? value.join(", ") : value);
  };

  const saveEdit = async (id: string) => {
    try {
      const result = results.find((r) => r.id === id);
      if (!result || !editing.field) return;

      const field = editing.field; // Capture the non-null field value
      const updateData: { [key: string]: string | string[] } = {};

      if (field === "keywords") {
        updateData[field] = editValue
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);
      } else {
        updateData[field] = editValue;
      }

      const response = await fetch(`/api/generate/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  [field]: field === "keywords" ? updateData[field] : editValue,
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error("Failed to save edit:", err);
    }
    setEditing({ id: null, field: null });
    setEditValue("");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/generate?id=${id}`);
      if (!response.ok) return;

      const data = await response.json();
      setResults((prev) =>
        prev.map((result) =>
          result.id === id
            ? {
                ...result,
                status: data.status,
                title: data.title,
                description: data.description,
                keywords: JSON.parse(data.keywords),
                error: data.error,
              }
            : result
        )
      );

      return data.status;
    } catch (error) {
      console.error("Error checking status:", error);
    }
  };

  // Function to delete a result
  const deleteResult = async (id: string) => {
    try {
      setDeleting((prev) => new Set(prev).add(id));
      const response = await fetch(`/api/generate/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setResults((prev) => prev.filter((result) => result.id !== id));
        // Also remove the preview if it exists
        setPreviews((prev) => {
          const newPreviews = { ...prev };
          const result = results.find((r) => r.id === id);
          if (result) {
            delete newPreviews[result.fileName];
          }
          return newPreviews;
        });
      } else {
        setError("Failed to delete image");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setDeleting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Update temp settings when modal opens
  useEffect(() => {
    if (showSettings) {
      setTempMetadataLimits({ ...metadataLimits });
    }
  }, [showSettings, metadataLimits]);

  // Function to handle temporary limit changes
  const handleTempLimitChange = (
    field: keyof MetadataLimits,
    value: number | string
  ) => {
    setTempMetadataLimits((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            AI Metadata Generator
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Metadata Settings
            </button>
            {results.length > 0 && (
              <button
                onClick={() => downloadCSV(results)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Metadata Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Metadata Settings</h2>
              </div>

              <div className="space-y-6">
                {/* Title Length Setting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title Length (characters)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={tempMetadataLimits.titleLength}
                      onChange={(e) =>
                        handleTempLimitChange(
                          "titleLength",
                          parseInt(e.target.value)
                        )
                      }
                      className="flex-grow"
                    />
                    <span className="text-blue-600 font-medium w-12 text-right">
                      {tempMetadataLimits.titleLength}
                    </span>
                  </div>
                </div>

                {/* Description Length Setting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description Length (characters)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="50"
                      max="300"
                      value={tempMetadataLimits.descriptionLength}
                      onChange={(e) =>
                        handleTempLimitChange(
                          "descriptionLength",
                          parseInt(e.target.value)
                        )
                      }
                      className="flex-grow"
                    />
                    <span className="text-blue-600 font-medium w-12 text-right">
                      {tempMetadataLimits.descriptionLength}
                    </span>
                  </div>
                </div>

                {/* Keywords Count Setting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords Count
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={tempMetadataLimits.keywordsCount}
                      onChange={(e) =>
                        handleTempLimitChange(
                          "keywordsCount",
                          parseInt(e.target.value)
                        )
                      }
                      className="flex-grow"
                    />
                    <span className="text-blue-600 font-medium w-12 text-right">
                      {tempMetadataLimits.keywordsCount}
                    </span>
                  </div>
                </div>

                {/* Help Text Setting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Help Text (Optional)
                  </label>
                  <div className="space-y-2">
                    <textarea
                      value={tempMetadataLimits.helpText}
                      onChange={(e) =>
                        handleTempLimitChange("helpText", e.target.value)
                      }
                      placeholder="Add any helpful context about the image to assist in generating better metadata. For example: 'This is a watercolor illustration of pomegranates in red and pink tones.'"
                      className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500">
                      Provide additional context to help generate more accurate
                      metadata. This is optional but can improve results.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Save the temporary settings to the actual settings
                    setMetadataLimits({ ...tempMetadataLimits });
                    setShowSettings(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-8 text-center bg-white shadow-sm hover:border-primary transition-colors"
        >
          <ArrowUpTrayIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-4 text-gray-600">
            Drag and drop your images here, or
          </p>
          <label className="bg-primary text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors inline-block">
            Browse Files
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
          <p className="mt-2 text-sm text-gray-500">
            Supported formats: JPEG, PNG, WebP
          </p>
        </div>

        {/* Add this after the Upload Area and before the Error Display */}
        {fileCounters.selected > 0 && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-green-500 transition-all duration-500"
                    style={{
                      width: `${
                        (fileCounters.processed / fileCounters.selected) * 100
                      }%`,
                    }}
                  />
                  <div
                    className="bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${
                        (fileCounters.inProgress / fileCounters.selected) * 100
                      }%`,
                    }}
                  />
                  <div
                    className="bg-red-500 transition-all duration-500"
                    style={{
                      width: `${
                        (fileCounters.failed / fileCounters.selected) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Counters Grid */}
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl font-bold text-gray-800 block mb-1 transition-all duration-300">
                    {fileCounters.selected}
                  </span>
                  <p className="text-sm text-gray-600">Total Files</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <span className="text-2xl font-bold text-green-600 block mb-1 transition-all duration-300">
                    {fileCounters.processed}
                  </span>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-2xl font-bold text-blue-600 block mb-1 transition-all duration-300">
                    {fileCounters.inProgress}
                  </span>
                  <p className="text-sm text-gray-600">Processing</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <span className="text-2xl font-bold text-red-600 block mb-1 transition-all duration-300">
                    {fileCounters.failed}
                  </span>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <span className="text-2xl font-bold text-yellow-600 block mb-1 transition-all duration-300">
                    {fileCounters.remaining}
                  </span>
                  <p className="text-sm text-gray-600">Queued</p>
                </div>
              </div>

              {/* Statistics */}
              <div className="flex justify-between items-center text-sm text-gray-600 pt-2 border-t">
                <div className="space-x-4">
                  <span>
                    Success Rate:{" "}
                    {fileCounters.selected > 0
                      ? (
                          (fileCounters.processed / fileCounters.selected) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                  <span>
                    Failure Rate:{" "}
                    {fileCounters.selected > 0
                      ? (
                          (fileCounters.failed / fileCounters.selected) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div>
                  {fileCounters.inProgress > 0 && (
                    <span className="text-blue-600">
                      Processing {fileCounters.inProgress} file
                      {fileCounters.inProgress !== 1 ? "s" : ""}...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* File List with Previews */}
        {files.length > 0 && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Selected Files
              </h2>
              <span className="text-sm text-gray-600">
                {files.length} file{files.length !== 1 ? "s" : ""} remaining
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-20 h-20 mr-3 flex-shrink-0">
                    {previews[file.name] && (
                      <img
                        src={previews[file.name]}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="flex-grow">
                    <span className="text-gray-700 break-all">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={processFiles}
              disabled={processing}
              className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed w-full"
            >
              {processing ? "Processing..." : "Generate Metadata"}
            </button>
          </div>
        )}

        {/* Results with Previews and Counters */}
        {results.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Results
            </h2>
            <div className="space-y-6">
              {results.map((result, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-4">
                      {previews[result.fileName] && (
                        <img
                          src={previews[result.fileName]}
                          alt={result.fileName}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {result.fileName}
                        </h3>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-sm mt-2 ${
                            result.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : result.status === "processing"
                              ? "bg-blue-100 text-blue-700"
                              : result.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {result.status.charAt(0).toUpperCase() +
                            result.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteResult(result.id)}
                      disabled={deleting.has(result.id)}
                      className={`text-gray-400 hover:text-red-500 transition-colors ${
                        deleting.has(result.id)
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      title="Delete"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {result.error && (
                    <div className="mb-4 text-red-600 text-sm">
                      Error: {result.error}
                    </div>
                  )}

                  {result.status === "completed" && (
                    <div className="space-y-4">
                      {/* Title with Counter */}
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Title:</span>
                            <span
                              className={`text-sm ${
                                result.title.length > metadataLimits.titleLength
                                  ? "text-red-500 font-medium"
                                  : "text-gray-500"
                              }`}
                            >
                              {result.title.length}/{metadataLimits.titleLength}{" "}
                              chars | {countWords(result.title)} words
                              {result.title.length >
                                metadataLimits.titleLength && " (Over limit)"}
                            </span>
                          </div>
                          {editing.id === result.id &&
                          editing.field === "title" ? (
                            <div className="flex items-center mt-1">
                              <div className="flex-grow">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className={`w-full p-2 border rounded-lg mr-2 ${
                                    editValue.length >
                                    metadataLimits.titleLength
                                      ? "border-red-300"
                                      : ""
                                  }`}
                                />
                                <div
                                  className={`text-sm mt-1 ${
                                    editValue.length >
                                    metadataLimits.titleLength
                                      ? "text-red-500 font-medium"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {editValue.length}/
                                  {metadataLimits.titleLength} chars |{" "}
                                  {countWords(editValue)} words
                                  {editValue.length >
                                    metadataLimits.titleLength &&
                                    " (Over limit)"}
                                </div>
                              </div>
                              <button
                                onClick={() => saveEdit(result.id)}
                                className="text-green-600 hover:text-green-700 ml-2"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center mt-1">
                              <p className="flex-grow">{result.title}</p>
                              <button
                                onClick={() =>
                                  startEditing(result.id, "title", result.title)
                                }
                                className="text-gray-400 hover:text-gray-600 mx-2"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() =>
                                  debouncedCopy(
                                    result.title,
                                    "title",
                                    result.id
                                  )
                                }
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {copyStatus[result.id + "title"] ? (
                                  <CheckIcon className="h-5 w-5 text-green-600" />
                                ) : (
                                  <ClipboardIcon className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description with Counter */}
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Description:</span>
                            <span
                              className={`text-sm ${
                                result.description.length >
                                metadataLimits.descriptionLength
                                  ? "text-red-500 font-medium"
                                  : "text-gray-500"
                              }`}
                            >
                              {result.description.length}/
                              {metadataLimits.descriptionLength} chars |{" "}
                              {countWords(result.description)} words
                              {result.description.length >
                                metadataLimits.descriptionLength &&
                                " (Over limit)"}
                            </span>
                          </div>
                          {editing.id === result.id &&
                          editing.field === "description" ? (
                            <div className="flex items-start mt-1">
                              <div className="flex-grow">
                                <textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className={`w-full p-2 border rounded-lg mr-2 ${
                                    editValue.length >
                                    metadataLimits.descriptionLength
                                      ? "border-red-300"
                                      : ""
                                  }`}
                                  rows={3}
                                />
                                <div
                                  className={`text-sm mt-1 ${
                                    editValue.length >
                                    metadataLimits.descriptionLength
                                      ? "text-red-500 font-medium"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {editValue.length}/
                                  {metadataLimits.descriptionLength} chars |{" "}
                                  {countWords(editValue)} words
                                  {editValue.length >
                                    metadataLimits.descriptionLength &&
                                    " (Over limit)"}
                                </div>
                              </div>
                              <button
                                onClick={() => saveEdit(result.id)}
                                className="text-green-600 hover:text-green-700 ml-2"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center mt-1">
                              <p className="flex-grow">{result.description}</p>
                              <button
                                onClick={() =>
                                  startEditing(
                                    result.id,
                                    "description",
                                    result.description
                                  )
                                }
                                className="text-gray-400 hover:text-gray-600 mx-2"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() =>
                                  debouncedCopy(
                                    result.description,
                                    "description",
                                    result.id
                                  )
                                }
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {copyStatus[result.id + "description"] ? (
                                  <CheckIcon className="h-5 w-5 text-green-600" />
                                ) : (
                                  <ClipboardIcon className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Keywords with Counter */}
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Keywords:</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                              {result.keywords.length}/
                              {metadataLimits.keywordsCount} keywords
                            </span>
                            <div className="flex items-center">
                              <button
                                onClick={() =>
                                  startEditing(
                                    result.id,
                                    "keywords",
                                    result.keywords
                                  )
                                }
                                className="text-gray-400 hover:text-gray-600 mx-2"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() =>
                                  debouncedCopy(
                                    result.keywords.join(", "),
                                    "keywords",
                                    result.id
                                  )
                                }
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {copyStatus[result.id + "keywords"] ? (
                                  <CheckIcon className="h-5 w-5 text-green-600" />
                                ) : (
                                  <ClipboardIcon className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        {editing.id === result.id &&
                        editing.field === "keywords" ? (
                          <div className="flex items-start mt-2">
                            <div className="flex-grow">
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full p-2 border rounded-lg mr-2"
                                rows={3}
                                placeholder="Enter keywords separated by commas"
                              />
                              <div className="text-sm text-gray-500 mt-1">
                                {
                                  editValue.split(",").filter((k) => k.trim())
                                    .length
                                }
                                /{metadataLimits.keywordsCount} keywords
                              </div>
                            </div>
                            <button
                              onClick={() => saveEdit(result.id)}
                              className="text-green-600 hover:text-green-700 ml-2"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {result.keywords?.map((keyword, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
