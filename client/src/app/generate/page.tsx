"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowDownTrayIcon, PhotoIcon } from "@heroicons/react/24/outline";
import {
  EditingState,
  MetadataResult,
  ProcessProgressData,
  ServerMetadataResponse,
} from "@/types";
import { downloadCSV, downloadImagesAsZip } from "@/actions";
import { FileUpload } from "@/components/FileUpload";
import { FileList } from "@/components/FileList";
import { MetadataEditor } from "@/components/MetadataEditor";
import { Toaster } from "react-hot-toast";
import { MetadataSettings } from "@/components/MetadataSettings";
import { ProcessingAnalysis } from "@/components/ProcessingAnalysis";

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
  const [isDownloading, setIsDownloading] = useState<{
    csv: boolean;
    images: boolean;
  }>({ csv: false, images: false });
  const [downloadInfo, setDownloadInfo] = useState<{
    id: string;
    downloadable: boolean;
  }>({
    id: "",
    downloadable: false,
  });

  // Add state for settings
  const [metadataSettings, setMetadataSettings] = useState({
    titleLength: 90,
    descriptionLength: 90,
    keywordsCount: 25,
    helpText: "",
  });

  // Add state for tracking stats
  const [stats, setStats] = useState({
    totalFiles: 0,
    completed: 0,
    processing: 0,
    failed: 0,
    queued: 0,
  });

  // Function to generate image previews
  const generatePreviews = useCallback((files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({
          ...prev,
          [file.name]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Update previews when files change
  useEffect(() => {
    generatePreviews(files);
  }, [files, generatePreviews]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
    setError(null);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      );
      setFiles((prev) => [...prev, ...selectedFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[fileToRemove.name];
      return newPreviews;
    });
  };

  const copyToClipboard = async (text: string, field: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ [id + field]: true });
      setTimeout(() => setCopyStatus({}), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
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

      const updateData: { [key: string]: string | string[] } = {};

      // Only include the field being edited
      if (editing.field === "keywords") {
        updateData[editing.field] = editValue
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k);
      } else {
        updateData[editing.field] = editValue;
      }

      // Add check for imageUrl
      if (!result.imageUrl) return;

      const response = await fetch(`/api/images/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imagePath: result.imageUrl.replace("http://localhost:5000", ""),
          _id: result.id,
          updateData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...data.updatedFields,
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

  // Remove the useEffect for socket initialization and move the socket setup to a new function

  console.log(files);
  // Update the processFiles function to handle socket connection
  const processFiles = async () => {
    setProcessing(true);
    setError(null);

    // Reset stats when starting new batch
    setStats({
      totalFiles: files.length,
      completed: 0,
      processing: 0,
      failed: 0,
      queued: files.length,
    });
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            AI Metadata Generator
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() =>
                downloadImagesAsZip(
                  downloadInfo.id,
                  downloadInfo.downloadable,
                  setIsDownloading
                )
              }
              disabled={
                isDownloading.images || !downloadInfo.downloadable || processing
              }
              className="flex items-center px-4 py-2 bg-[#2F2F2F] text-white rounded-md hover:bg-[#1F1F1F] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isDownloading.images ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
              ) : (
                <PhotoIcon className="h-5 w-5 mr-2" />
              )}
              ZIP
            </button>
            <button
              onClick={() => downloadCSV(results, setIsDownloading)}
              disabled={isDownloading.csv || isDownloading.images || processing}
              className="flex items-center px-4 py-2 bg-[#2F7FFF] text-white rounded-md hover:bg-[#1F6FEF] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isDownloading.csv ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
              ) : (
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              )}
              CSV
            </button>
            <MetadataSettings
              onSave={setMetadataSettings}
              initialSettings={metadataSettings}
            />
          </div>
        </div>

        <FileUpload onDrop={onDrop} handleFileSelect={handleFileSelect} />

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Show analysis when there are results or during processing */}
        {(results.length > 0 || processing) && (
          <ProcessingAnalysis
            totalFiles={stats.totalFiles}
            completed={stats.completed}
            processing={stats.processing}
            failed={stats.failed}
            queued={stats.queued}
          />
        )}

        {files.length > 0 && (
          <FileList
            files={files}
            previews={previews}
            removeFile={removeFile}
            processFiles={processFiles}
            processing={processing}
          />
        )}

        {results.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800">Results</h2>
            </div>
            <div className="space-y-6">
              {results.map((result) => (
                <MetadataEditor
                  key={result.id}
                  result={result}
                  editing={editing}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  startEditing={startEditing}
                  saveEdit={saveEdit}
                  copyToClipboard={copyToClipboard}
                  copyStatus={copyStatus}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
