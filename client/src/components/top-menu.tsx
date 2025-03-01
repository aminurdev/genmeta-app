"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Trash2,
  Play,
  Download,
  FileSpreadsheet,
  Settings,
  Sun,
  Moon,
  Search,
  Filter,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useImageContext } from "@/components/context/image-context";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Analysis, { AnalysisProps } from "./analysis";
import { processImage } from "@/services/image-services";
type Props = {
  searchQuery: string;
  statusFilter: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setStatusFilter: (value: string) => void;
  analysisProps: AnalysisProps;
};

export function TopMenu({
  searchQuery,
  statusFilter,
  handleSearch,
  setStatusFilter,
  analysisProps,
}: Props) {
  const { theme, setTheme } = useTheme();
  const { addImages, clearAllImages, images, setImages } = useImageContext();
  const [isDragging, setIsDragging] = useState(false);

  // Settings state
  const [titleLimit, setTitleLimit] = useState(50);
  const [descriptionLimit, setDescriptionLimit] = useState(100);
  const [keywordLimit, setKeywordLimit] = useState(10);
  const [autoSuggestions, setAutoSuggestions] = useState(true);

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      // Convert FileList to array and filter for image files
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length === 0) {
        toast.error("No valid images");
        return;
      }

      // Add images to context
      addImages(imageFiles);

      toast.success(`${imageFiles.length} Files uploaded`);
    }
  };

  // Handle drag events
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
    handleFileUpload(e.dataTransfer.files);
  };

  // Handle clear all
  const handleClearAll = () => {
    clearAllImages();
    toast.info("All images cleared");
  };

  // Handle process all
  const handleProcessAll = async () => {
    for (const image of images.images) {
      try {
        const formData = new FormData();

        // Fetch the image as a blob
        const imageResponse = await fetch(image.imageUrl);
        const blob = await imageResponse.blob();

        // Convert blob to a File object
        const file = new File([blob], image.imageName, {
          type: image.metadata.type,
        });
        formData.append("image", file);

        // Upload the file
        const uploadResponse = await fetch(
          "http://localhost:5000/api/v1/images/upload/single",
          {
            method: "POST",
            headers: {
              authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2JjNTVkMmJhMDRiMDc2MjU2MGQ1Y2QiLCJuYW1lIjoiQW1pbnVyIiwiZW1haWwiOiJhbWludXJhYWFAZ2FtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQwODE4ODYyLCJleHAiOjE3NDA5MDUyNjJ9.8-4Bx_istIo2w30Lg_q5Ox3i7xu67Y6un6AE6Kepye4`,
            },
            body: formData,
          }
        );

        const data = await uploadResponse.json();
        console.log("Upload Success:", data);
      } catch (err) {
        console.error("Error processing image:", image.imageName, err);
      }
    }
  };

  // Handle download ZIP
  const handleDownloadZip = () => {
    const promise = new Promise((resolve, reject) =>
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve({ name: "Svelte Sonner" });
        } else {
          reject();
        }
      }, 1500)
    );

    toast.promise(promise, {
      loading: "Download starting...",
      success: () => {
        return "Download started";
      },
      error: "Error... :( Try again!",
    });
  };

  // Handle export CSV
  const handleExportCsv = () => {
    const promise = new Promise((resolve, reject) =>
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve({ name: "Svelte Sonner" });
        } else {
          reject();
        }
      }, 1500)
    );

    toast.promise(promise, {
      loading: "Download starting...",
      success: () => {
        return "Download started";
      },
      error: "Error... :( Try again!",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 justify-between">
        <h1 className="text-2xl font-bold mb-4">Image Management</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings size={18} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Adjust metadata constraints and preferences.
                  </p>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <div className="flex justify-between">
                      <Label htmlFor="title-limit">Title Character Limit</Label>
                      <span className="text-sm text-muted-foreground">
                        {titleLimit}
                      </span>
                    </div>
                    <Slider
                      id="title-limit"
                      min={10}
                      max={100}
                      step={5}
                      value={[titleLimit]}
                      onValueChange={(value) => setTitleLimit(value[0])}
                    />
                  </div>

                  <div className="grid gap-1">
                    <div className="flex justify-between">
                      <Label htmlFor="desc-limit">
                        Description Character Limit
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {descriptionLimit}
                      </span>
                    </div>
                    <Slider
                      id="desc-limit"
                      min={50}
                      max={500}
                      step={10}
                      value={[descriptionLimit]}
                      onValueChange={(value) => setDescriptionLimit(value[0])}
                    />
                  </div>

                  <div className="grid gap-1">
                    <div className="flex justify-between">
                      <Label htmlFor="keyword-limit">Keyword Count Limit</Label>
                      <span className="text-sm text-muted-foreground">
                        {keywordLimit}
                      </span>
                    </div>
                    <Slider
                      id="keyword-limit"
                      min={5}
                      max={20}
                      step={1}
                      value={[keywordLimit]}
                      onValueChange={(value) => setKeywordLimit(value[0])}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-suggestions">
                      Auto-suggestions for keywords
                    </Label>
                    <Switch
                      id="auto-suggestions"
                      checked={autoSuggestions}
                      onCheckedChange={setAutoSuggestions}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <div className="relative mr-2">
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload size={16} className="mr-2" />
                Upload
              </label>
            </Button>
          </div>

          <Button
            variant="destructive"
            onClick={handleClearAll}
            disabled={images.images.length === 0}
          >
            <Trash2 size={16} className="mr-2" />
            Clear All
          </Button>

          <Button
            variant="outline"
            onClick={handleProcessAll}
            disabled={images.images.length === 0}
          >
            <Play size={16} className="mr-2" />
            Process All
          </Button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-8 h-9 w-full sm:w-[200px] md:w-[300px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px]">
                <div className="flex items-center gap-1">
                  <Filter size={16} />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Images</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="queue">In Queue</SelectItem>
                <SelectItem value="default">Default</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadZip}
            disabled={images.images.length === 0}
          >
            <Download size={16} className="mr-2" />
            Download ZIP
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={images.images.length === 0}
          >
            <FileSpreadsheet size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      <Analysis props={analysisProps} />

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          analysisProps.images.images.length > 0 && "hidden"
        }  ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-medium">Drag & Drop Images Here</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Drop your images here, or click to browse. Supports JPG, PNG, GIF,
            and WebP.
          </p>
          <div className="mt-2">
            <Button asChild variant="secondary" size="sm">
              <label htmlFor="file-upload-area" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
            <input
              type="file"
              id="file-upload-area"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
