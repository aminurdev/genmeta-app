/* eslint-disable @next/next/no-img-element */
"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import {
  ImageItem,
  ImageStatus,
  useImageContext,
} from "./context/image-context";
import { TopMenu } from "./top-menu";
import { MetadataPanel } from "./metadata-panel";

export function ImageGrid() {
  const {
    images,
    selectedImage,
    setSelectedImage,
    selectImage,
    selectAllImages,
    deleteSelectedImages,
  } = useImageContext();

  const [selectAll, setSelectAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragEndPos, setDragEndPos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const resizeStartX = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // Counters for status badges
  const totalImages = images.images.length;
  const processingCount = images.images.filter(
    (img) => img.status === "queue"
  ).length;
  const successCount = images.images.filter(
    (img) => img.status === "success"
  ).length;
  const failedCount = images.images.filter(
    (img) => img.status === "failed"
  ).length;
  const queueCount = images.images.filter(
    (img) => img.status === "default"
  ).length;

  // Handle select all
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    selectAllImages(newSelectAll);
  };

  // Update selectAll state when images change
  useEffect(() => {
    setSelectAll(
      images.images.length > 0 && images.images.every((img) => img.selected)
    );
  }, [images]);

  const handleImageClick = (
    image: ImageItem,
    index: number,
    event: React.MouseEvent
  ) => {
    if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      for (let i = start; i <= end + 1; i++) {
        selectImage(images.images[i].imageId);
      }
    } else if (event.ctrlKey || event.metaKey) {
      selectImage(image.imageId);
    } else {
      setSelectedImage(image);
    }
    setLastSelectedIndex(index);
  };

  // Handle delete selected
  const handleDeleteSelected = () => {
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    deleteSelectedImages();
    setShowDeleteDialog(false);
  };

  // Handle drag selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (gridRef.current && e.button === 0) {
      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragStartPos({ x, y });
      setDragEndPos({ x, y });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragEndPos({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && gridRef.current) {
      const minX = Math.min(dragStartPos.x, dragEndPos.x);
      const maxX = Math.max(dragStartPos.x, dragEndPos.x);
      const minY = Math.min(dragStartPos.y, dragEndPos.y);
      const maxY = Math.max(dragStartPos.y, dragEndPos.y);

      // Get all images inside the grid
      const imageElements = gridRef.current.querySelectorAll(".image-item");

      const selectedImageIds: string[] = [];

      imageElements.forEach((imgElement) => {
        const rect = imgElement.getBoundingClientRect();
        const gridRect = gridRef.current!.getBoundingClientRect();

        // Convert rect to be relative to grid
        const imgX1 = rect.left - gridRect.left;
        const imgY1 = rect.top - gridRect.top;
        const imgX2 = imgX1 + rect.width;
        const imgY2 = imgY1 + rect.height;

        // Check if the image is inside the selection box
        if (imgX2 > minX && imgX1 < maxX && imgY2 > minY && imgY1 < maxY) {
          selectedImageIds.push(imgElement.getAttribute("data-id")!);
        }
      });

      selectAllImages(false); // Deselect all first
      selectedImageIds.forEach((id) => selectImage(id)); // Select only the images inside the area

      setIsDragging(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter images based on search and status
  const filteredImages = images.images.filter((img: ImageItem) => {
    const matchesSearch =
      img.imageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.metadata?.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      img.metadata?.keywords?.some((k: string) =>
        k.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus = statusFilter === "all" || img.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle panel resize
  const startResize = (e: React.MouseEvent) => {
    setIsResizing(true);
    resizeStartX.current = e.clientX;
  };

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const delta = resizeStartX.current - e.clientX;
        setPanelWidth((prev) => Math.max(300, Math.min(800, prev + delta)));
        resizeStartX.current = e.clientX;
      }
    },
    [isResizing]
  );

  const endResize = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", endResize);
      return () => {
        document.removeEventListener("mousemove", handleResize);
        document.removeEventListener("mouseup", endResize);
      };
    }
  }, [isResizing, handleResize]);

  // Status badge component
  const StatusBadge = ({ status }: { status: ImageStatus }) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">✅ Success</Badge>;
      case "failed":
        return <Badge className="bg-red-500">❌ Failed</Badge>;
      case "queue":
        return <Badge className="bg-yellow-500">⏳ In Queue</Badge>;
      default:
        return <Badge className="bg-gray-500">⬤ Default</Badge>;
    }
  };
  const analysisProps = {
    totalImages,
    queueCount,
    failedCount,
    processingCount,
    successCount,
    selectAll,
    handleDeleteSelected,
    images,
    handleSelectAll,
  };
  return (
    <div className="container mx-auto py-4 px-2 md:px-4">
      <TopMenu
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        handleSearch={handleSearch}
        setStatusFilter={setStatusFilter}
        analysisProps={analysisProps}
      />
      <div className="flex flex-col lg:flex-row gap-4 mt-4">
        <div className="flex-1">
          <div className="flex flex-col lg:flex-row gap-4 ">
            <div className="flex-1">
              <div
                ref={gridRef}
                className="relative border rounded-lg p-4 bg-background selection:bg-transparent"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {filteredImages.length === 0 ? (
                  <></>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredImages.map((image: ImageItem, index: number) => (
                      <div
                        key={image.imageId}
                        data-id={image.imageId}
                        className={cn(
                          "relative border rounded-lg overflow-hidden group cursor-pointer transition-all image-item", // Added `image-item` class
                          image.selected ? "ring-2 ring-primary" : "",
                          selectedImage?.imageId === image.imageId
                            ? "ring-2 ring-blue-500"
                            : ""
                        )}
                        onClick={(event) =>
                          handleImageClick(image, index, event)
                        }
                      >
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={image.selected}
                            onCheckedChange={() => selectImage(image.imageId)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-5 w-5 bg-white/80 dark:bg-gray-800/80 border-gray-300"
                          />
                        </div>
                        <div className="absolute top-2 right-2 z-10">
                          <StatusBadge status={image.status} />
                        </div>
                        <div className="aspect-square bg-muted h-4/5">
                          <img
                            src={image.imageUrl || "/placeholder.svg"}
                            alt={image.imageName}
                            className="w-full h-full object-cover"
                            loading="eager"
                          />
                        </div>{" "}
                        <div className="p-2 bg-background">
                          <p className="text-sm font-medium truncate">
                            {image.imageName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {image.metadata.resolution}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isDragging && (
                  <div
                    className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-20"
                    style={{
                      left: Math.min(dragStartPos.x, dragEndPos.x),
                      top: Math.min(dragStartPos.y, dragEndPos.y),
                      width: Math.abs(dragEndPos.x - dragStartPos.x),
                      height: Math.abs(dragEndPos.y - dragStartPos.y),
                    }}
                  />
                )}
              </div>
            </div>

            {selectedImage && (
              <>
                <div
                  className="w-1 cursor-col-resize bg-border hover:bg-primary/50 transition-colors"
                  onMouseDown={startResize}
                />

                <div
                  className="w-full lg:w-auto"
                  style={{ width: `${panelWidth}px` }}
                >
                  <MetadataPanel image={selectedImage} />
                </div>
              </>
            )}

            <AlertDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete{" "}
                    {
                      images.images.filter((img: ImageItem) => img.selected)
                        .length
                    }{" "}
                    selected image(s). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>{" "}
        </div>
      </div>
    </div>
  );
}
