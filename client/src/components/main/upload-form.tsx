"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Upload, X, ImageIcon, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { getBaseApi, getAccessToken } from "@/services/image-services";

export default function UploadForm() {
  const [loading, setLoading] = useState(false);
  const [completeCount, setCompletedCount] = useState<number>(0);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [settings, setSettings] = useState(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("imageSeoSettings");
      return savedSettings
        ? JSON.parse(savedSettings)
        : {
            titleLength: 90,
            descriptionLength: 120,
            keywordCount: 25,
          };
    }
    return {
      titleLength: 90,
      descriptionLength: 120,
      keywordCount: 25,
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
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleGenerateMore = () => {
    setFiles([]);
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    const batchId = uuidv4();
    setLoading(true);
    setShowModal(true);
    setCompletedCount(0);

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("image", files[i]);
      formData.append("batchId", batchId);
      formData.append("titleLength", settings.titleLength);
      formData.append("descriptionLength", settings.descriptionLength);
      formData.append("keywordCount", settings.keywordCount);

      const baseAPi = await getBaseApi();
      const accessToken = await getAccessToken();

      try {
        const response = await fetch(`${baseAPi}/images/upload/single`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`Upload failed for ${files[i].name}`);
        }
        setCompletedCount((prev) => prev + 1);
      } catch (error) {
        console.error(`Error uploading ${files[i].name}:`, error);
      }
    }
    setLoading(false);
  };

  console.log({ loading, completeCount });
  console.log(settings);

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
                className={` border-2 border-dashed rounded-lg text-center ${
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
                  <h3 className="font-medium mb-3">
                    Selected Images ({files.length})
                  </h3>
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
                        <p className="text-xs mt-1 truncate">{file.name}</p>
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
                    max={120}
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
                    max={200}
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
                    max={50}
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

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="advanced">
                  <AccordionTrigger>Advanced Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="language">Preferred Language</Label>
                        <select
                          id="language"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="it">Italian</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tone">Content Tone</Label>
                        <select
                          id="tone"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="friendly">Friendly</option>
                          <option value="formal">Formal</option>
                          <option value="technical">Technical</option>
                        </select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
          {loading ? "Generating SEO Metadata" : "Generate SEO Metadata"}
        </Button>
      </div>

      <Dialog open={showModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {loading ? "Uploading Images..." : "Upload Complete"}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            {loading ? (
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            ) : (
              <p className="text-lg font-semibold text-green-600">
                All uploads completed!
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {completeCount} of {files.length} images processed
            </p>
          </div>
          {!loading && (
            <DialogFooter>
              <Button variant="outline" onClick={handleGenerateMore}>
                Generate more
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/results`}>View</Link>
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}
