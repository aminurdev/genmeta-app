"use client";

import type React from "react";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Plus,
  Sparkles,
  Copy,
  ZoomIn,
  ZoomOut,
  Move,
  Download,
  Calendar,
  FileType,
  Maximize2,
  Hash,
  Link,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { ImageItem, useImageContext } from "./context/image-context";

interface MetadataPanelProps {
  image: ImageItem;
}

export function MetadataPanel({ image }: MetadataPanelProps) {
  const { updateImageMetadata } = useImageContext();
  const [title, setTitle] = useState(image.metadata.title);
  const [description, setDescription] = useState(image.metadata.description);
  const [keywords, setKeywords] = useState(image.metadata.keywords);
  const [newKeyword, setNewKeyword] = useState("");
  const [zoom, setZoom] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);

  // Character limits
  const MAX_TITLE_CHARS = 50;
  const MAX_DESCRIPTION_CHARS = 100;
  const MAX_KEYWORDS = 10;

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value.slice(0, MAX_TITLE_CHARS);
    setTitle(newTitle);
    updateImageMetadata(image.imageId, { title: newTitle });
  };

  // Handle description change
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newDescription = e.target.value.slice(0, MAX_DESCRIPTION_CHARS);
    setDescription(newDescription);
    updateImageMetadata(image.imageId, { description: newDescription });
  };

  // Handle adding a keyword
  const handleAddKeyword = () => {
    if (
      newKeyword.trim() &&
      keywords.length < MAX_KEYWORDS &&
      !keywords.includes(newKeyword.trim())
    ) {
      const updatedKeywords = [...keywords, newKeyword.trim()];
      setKeywords(updatedKeywords);
      updateImageMetadata(image.imageId, { keywords: updatedKeywords });
      setNewKeyword("");
    }
  };

  // Handle removing a keyword
  const handleRemoveKeyword = (keyword: string) => {
    const updatedKeywords = keywords.filter((k) => k !== keyword);
    setKeywords(updatedKeywords);
    updateImageMetadata(image.imageId, { keywords: updatedKeywords });
  };

  // Handle keyword reordering
  const handleKeywordReorder = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(keywords);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setKeywords(items);
    updateImageMetadata(image.imageId, { keywords: items });
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  // Handle reset zoom
  const handleResetZoom = () => {
    setZoom(1);
  };

  // Generate metadata
  const handleGenerateMetadata = () => {
    setIsGenerating(true);

    // Simulate API call
    setTimeout(() => {
      const generatedTitle = "AI Generated Image Title";
      const generatedDescription =
        "This is an automatically generated description for the image based on its content.";
      const generatedKeywords = [
        "ai",
        "generated",
        "automatic",
        "content",
        "image",
      ];

      setTitle(generatedTitle);
      setDescription(generatedDescription);
      setKeywords(generatedKeywords);
      updateImageMetadata(image.imageId, {
        title: generatedTitle,
        description: generatedDescription,
        keywords: generatedKeywords,
      });

      setSuggestedKeywords([
        "suggestion1",
        "suggestion2",
        "photo",
        "digital",
        "high-quality",
      ]);
      setIsGenerating(false);
    }, 1500);
  };

  // Copy metadata to clipboard
  const handleCopyMetadata = () => {
    const metadataText = `
Title: ${title}
Description: ${description}
Keywords: ${keywords.join(", ")}
Resolution: ${image.metadata.resolution || "N/A"}
Format: ${image.metadata.format || "N/A"}
Creation Date: ${
      image.metadata.creationDate
        ? new Date(image.metadata.creationDate).toLocaleString()
        : "N/A"
    }
Image ID: ${image.imageId || "N/A"}
Image URL: ${image.imageUrl || "N/A"}
    `.trim();

    navigator.clipboard.writeText(metadataText);
  };

  // Add suggested keyword
  const handleAddSuggestion = (keyword: string) => {
    if (keywords.length < MAX_KEYWORDS && !keywords.includes(keyword)) {
      const updatedKeywords = [...keywords, keyword];
      setKeywords(updatedKeywords);
      updateImageMetadata(image.imageId, { keywords: updatedKeywords });
      setSuggestedKeywords((prev) => prev.filter((k) => k !== keyword));
    }
  };

  return (
    <div className="border rounded-lg h-full overflow-hidden bg-background">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">Image Details</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopyMetadata}>
            <Copy size={16} />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={image.imageUrl} download={image.imageName}>
              <Download size={16} />
            </a>
          </Button>
        </div>
      </div>

      <div className="p-4 border-b">
        <div
          className="relative bg-muted rounded-lg overflow-hidden"
          style={{ height: "200px" }}
        >
          <img
            src={image.imageUrl || "/placeholder.svg"}
            alt={image.imageName}
            className="w-full h-full object-contain transition-transform"
            style={{ transform: `scale(${zoom})` }}
          />

          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 p-1 rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomOut}
            >
              <ZoomOut size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleResetZoom}
            >
              <Move size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomIn}
            >
              <ZoomIn size={14} />
            </Button>
          </div>
        </div>

        <div className="mt-2 text-sm">
          <p className="font-medium">{image.imageName}</p>
          <p className="text-muted-foreground">
            {"N/A"} · {"N/A"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="metadata">
        <TabsList className="w-full">
          <TabsTrigger value="metadata" className="flex-1">
            Metadata
          </TabsTrigger>
          <TabsTrigger value="info" className="flex-1">
            Technical Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metadata" className="p-4 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="title">Title</Label>
              <span className="text-xs text-muted-foreground">
                {title.length}/{MAX_TITLE_CHARS}
              </span>
            </div>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              maxLength={MAX_TITLE_CHARS}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="description">Description</Label>
              <div className="text-xs text-muted-foreground">
                <span>
                  {description.length}/{MAX_DESCRIPTION_CHARS} chars
                </span>
                <span className="ml-2">
                  {description.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              maxLength={MAX_DESCRIPTION_CHARS}
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="keywords">Keywords</Label>
              <span className="text-xs text-muted-foreground">
                {keywords.length}/{MAX_KEYWORDS}
              </span>
            </div>

            <div className="flex gap-2 mb-2">
              <Input
                id="keywords"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                disabled={keywords.length >= MAX_KEYWORDS}
              />
              <Button
                onClick={handleAddKeyword}
                disabled={keywords.length >= MAX_KEYWORDS || !newKeyword.trim()}
                size="sm"
              >
                <Plus size={16} />
              </Button>
            </div>

            <DragDropContext onDragEnd={handleKeywordReorder}>
              <Droppable droppableId="keywords" direction="horizontal">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-wrap gap-2 min-h-[40px]"
                  >
                    {keywords.map((keyword, index) => (
                      <Draggable
                        key={keyword}
                        draggableId={keyword}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <Badge variant="secondary" className="px-2 py-1">
                              {keyword}
                              <button
                                onClick={() => handleRemoveKeyword(keyword)}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                              >
                                <X size={12} />
                              </button>
                            </Badge>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {suggestedKeywords.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Suggested keywords:
                </p>
                <div className="flex flex-wrap gap-1">
                  {suggestedKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary"
                      onClick={() => handleAddSuggestion(keyword)}
                    >
                      + {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            className="w-full mt-4"
            onClick={handleGenerateMetadata}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Generate Metadata
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="info" className="p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Maximize2 size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Resolution</p>
                <p className="text-sm text-muted-foreground">
                  {image.metadata.resolution || "Not available"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FileType size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Format</p>
                <p className="text-sm text-muted-foreground">
                  {image.metadata.format || "Not available"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Creation Date</p>
                <p className="text-sm text-muted-foreground">
                  {image.metadata.creationDate
                    ? new Date(image.metadata.creationDate).toLocaleString()
                    : "Not available"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Hash size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Image ID</p>
                <p className="text-sm text-muted-foreground">
                  {image.imageId || "Not available"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Image URL</p>
                <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                  {image.imageUrl || "Not available"}
                </p>
              </div>
            </div>
          </div>

          <Card className="mt-4">
            <CardContent className="p-3">
              <p className="text-sm font-medium mb-1">API Response</p>
              <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[150px]">
                {JSON.stringify(
                  {
                    id: image.imageId,
                    metadata: image.metadata,
                    status: image.status,
                  },
                  null,
                  2
                )}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
                onClick={handleCopyMetadata}
              >
                <Copy size={12} className="mr-1" />
                Copy Response
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
