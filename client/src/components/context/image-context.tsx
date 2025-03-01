"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

export type ImageStatus = "success" | "failed" | "queue" | "default";

export interface ImageItem {
  imageId: string;
  imageName: string;
  imageUrl: string;
  status: ImageStatus;
  selected: boolean;
  metadata: {
    title?: string;
    description?: string;
    keywords?: string[];
    resolution?: string;
    format?: string;
    creationDate?: string;
    size?: string;
    type?: string;
  };
}
export interface Images {
  _id?: string;
  userId?: string;
  batchId?: string;
  images: ImageItem[];
}

interface ImageContextType {
  images: Images;
  setImages: React.Dispatch<React.SetStateAction<Images>>;
  selectedImage: ImageItem | null;
  setSelectedImage: React.Dispatch<React.SetStateAction<ImageItem | null>>;
  addImages: (files: File[]) => void;
  clearAllImages: () => void;
  deleteSelectedImages: () => void;
  selectImage: (id: string) => void;
  selectAllImages: (selected: boolean) => void;
  updateImageMetadata: (
    id: string,
    metadata: Partial<ImageItem["metadata"]>
  ) => void;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<Images>({ images: [] });
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Add new images from file upload
  const addImages = (files: File[]) => {
    const timestamp = Date.now();
    const batchId = images.batchId || `batch-${timestamp}`;

    const newImages: ImageItem[] = files.map((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      return {
        imageId: `upload-${timestamp}-${index}`,
        imageName: file.name,
        imageUrl: objectUrl,
        status: "default",
        selected: false,
        metadata: {
          title: file.name.split(".")[0],
          description: `Uploaded image: ${file.name}`,
          keywords: ["uploaded", "new"],
          resolution: "Unknown",
          format: file.type.split("/")[1]?.toUpperCase() || "Unknown",
          creationDate: new Date().toISOString(),
          size: formatFileSize(file.size),
          type: file.type,
        },
      };
    });

    setImages((prev) => ({
      ...prev,
      batchId,
      images: [...prev.images, ...newImages],
    }));
  };

  // Clear all images and revoke object URLs
  const clearAllImages = () => {
    images.images.forEach((image) => URL.revokeObjectURL(image.imageUrl));
    setImages({ ...images, images: [] });
    setSelectedImage(null);
  };

  // Delete selected images and revoke their object URLs
  const deleteSelectedImages = () => {
    setImages((prev) => {
      const remainingImages = prev.images.filter((img) => {
        if (img.selected) {
          URL.revokeObjectURL(img.imageUrl);
          return false;
        }
        return true;
      });
      return { ...prev, images: remainingImages };
    });

    if (selectedImage?.selected) {
      setSelectedImage(null);
    }
  };

  // Select/deselect an image
  const selectImage = (id: string) => {
    setImages((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.imageId === id ? { ...img, selected: !img.selected } : img
      ),
    }));

    if (selectedImage?.imageId === id) {
      setSelectedImage((prev) =>
        prev ? { ...prev, selected: !prev.selected } : null
      );
    }
  };

  // Select/deselect all images
  const selectAllImages = (selected: boolean) => {
    setImages((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({ ...img, selected })),
    }));
  };

  // Update image metadata
  const updateImageMetadata = (
    id: string,
    metadata: Partial<ImageItem["metadata"]>
  ) => {
    setImages((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.imageId === id
          ? { ...img, metadata: { ...img.metadata, ...metadata } }
          : img
      ),
    }));

    if (selectedImage?.imageId === id) {
      setSelectedImage((prev) =>
        prev ? { ...prev, metadata: { ...prev.metadata, ...metadata } } : null
      );
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.images.forEach((image) => URL.revokeObjectURL(image.imageUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ImageContext.Provider
      value={{
        images,
        setImages,
        selectedImage,
        setSelectedImage,
        addImages,
        clearAllImages,
        deleteSelectedImages,
        selectImage,
        selectAllImages,
        updateImageMetadata,
      }}
    >
      {children}
    </ImageContext.Provider>
  );
}

export function useImageContext() {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error("useImageContext must be used within an ImageProvider");
  }
  return context;
}
