"use client";

/* eslint-disable @next/next/no-img-element */
import type React from "react";
import { PencilIcon, Trash, Check, Save, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Defining Image and metadata types to match parent component
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

interface ImageCardProps {
  item: Image;
  editingItem: string | null;
  editData: {
    title: string;
    description: string;
    keywords: string[];
  };
  setEditData: React.Dispatch<
    React.SetStateAction<{
      title: string;
      description: string;
      keywords: string[];
    }>
  >;
  metadataLimits: {
    titleLength: number;
    descriptionLength: number;
    keywordCount: number;
  };
  copiedField: string | null;
  loading: boolean;
  countWords: (text: string) => number;
  handleEdit: (item: Image) => void;
  handleCancel: () => void;
  handleSave: () => Promise<void>;

  handleCopyField: (text: string, fieldName: string) => void;
  handleKeywordChange: (keywords: string) => void;
  handleKeywordBlur: () => void;
  handleDeleteDialogOpen: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  item,
  editingItem,
  editData,
  setEditData,
  metadataLimits,
  copiedField,
  loading,
  countWords,
  handleEdit,
  handleCancel,
  handleSave,
  handleCopyField,
  handleKeywordChange,
  handleKeywordBlur,
  handleDeleteDialogOpen,
}) => {
  return (
    <div key={item._id} className="p-3 sm:p-4 bg-accent/5 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:space-x-4">
          <img
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.imageName}
            className="w-full sm:w-24 sm:h-24 object-cover rounded-lg bg-card"
          />
          <div className="mt-2 sm:mt-0">
            <h3
              className="font-medium text-foreground text-sm sm:text-base"
              style={{
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {item.imageName}
            </h3>
            <span className="inline-block px-2 py-1 rounded-full text-xs sm:text-sm mt-2 bg-muted text-foreground">
              Image metadata
            </span>
          </div>
        </div>
        <div className="flex justify-end sm:justify-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(item)}
            className="text-muted-foreground hover:text-foreground mx-1"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteDialogOpen(item._id)}
            disabled={loading}
            className={`text-muted-foreground hover:text-destructive transition-colors mx-1 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Delete"
          >
            <Trash className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>

      {item.error && (
        <div className="mb-4 text-destructive text-xs sm:text-sm">
          Error: {item.error}
        </div>
      )}

      {editingItem === item._id ? (
        <div className="space-y-4">
          {/* Title with Counter */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm sm:text-base">Title:</span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {editData.title.length}/{metadataLimits.titleLength} chars |{" "}
                {countWords(editData.title)} words
              </span>
            </div>
            <div className="flex items-center mt-1">
              <div className="w-full">
                <Input
                  type="text"
                  value={editData.title}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className={`w-full ${
                    editData.title.length > metadataLimits.titleLength
                      ? "border-destructive"
                      : ""
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Description with Counter */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm sm:text-base">
                Description:
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {editData.description.length}/{metadataLimits.descriptionLength}{" "}
                chars | {countWords(editData.description)} words
              </span>
            </div>
            <div className="flex items-start mt-1">
              <div className="w-full">
                <Textarea
                  value={editData.description}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className={`w-full ${
                    editData.description.length >
                    metadataLimits.descriptionLength
                      ? "border-destructive"
                      : ""
                  }`}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Keywords with Counter */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm sm:text-base">
                Keywords:
              </span>
              <div className="flex items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {editData.keywords.length}/{metadataLimits.keywordCount}{" "}
                  keywords
                </span>
              </div>
            </div>
            <div className="flex items-start mt-2">
              <div className="w-full">
                <Textarea
                  value={editData.keywords.join(", ")}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  onBlur={handleKeywordBlur}
                  className="w-full"
                  rows={3}
                  placeholder="Enter keywords separated by commas"
                />
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {editData.keywords.length}/{metadataLimits.keywordCount}{" "}
                  keywords
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              size="sm"
              className="h-8 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 h-8 sm:h-10 text-xs sm:text-sm"
              size="sm"
            >
              <Save className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Title with Counter */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm sm:text-base flex-1">
                Title:
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {item.metadata.title.length}/{metadataLimits.titleLength}{" "}
                  chars | {countWords(item.metadata.title)} words
                </span>{" "}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyField(item.metadata.title, "Title")}
                  className="text-muted-foreground hover:text-foreground h-7 w-7 sm:h-8 sm:w-8"
                >
                  {copiedField === "Title" ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  ) : (
                    <Clipboard className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-1">
              <p className="text-xs sm:text-sm break-words">
                {item.metadata.title}
              </p>
            </div>
          </div>

          {/* Description with Counter */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm sm:text-base flex-1">
                Description:
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {item.metadata.description.length}/
                  {metadataLimits.descriptionLength} chars |{" "}
                  {countWords(item.metadata.description)} words
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleCopyField(item.metadata.description, "Description")
                  }
                  className="text-muted-foreground hover:text-foreground h-7 w-7 sm:h-8 sm:w-8"
                >
                  {copiedField === "Description" ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  ) : (
                    <Clipboard className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-1">
              <p className="text-xs sm:text-sm break-words">
                {item.metadata.description}
              </p>
            </div>
          </div>

          {/* Keywords with Counter */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm sm:text-base">
                Keywords:
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {item.metadata.keywords.length}/{metadataLimits.keywordCount}{" "}
                  keywords
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleCopyField(
                      item.metadata.keywords.join(", "),
                      "Keywords"
                    )
                  }
                  className="text-muted-foreground hover:text-foreground h-7 w-7 sm:h-8 sm:w-8"
                >
                  {copiedField === "Keywords" ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  ) : (
                    <Clipboard className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
              {item.metadata.keywords?.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary/10 text-blue-500 rounded-full text-xs sm:text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCard;
