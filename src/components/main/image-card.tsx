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
    <div key={item._id} className="p-4 bg-accent/40 rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4">
          <img
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.imageName}
            className="w-24 h-24 object-cover rounded-lg bg-card "
          />
          <div>
            <h3 className="font-medium text-foreground">{item.imageName}</h3>
            <span className="inline-block px-2 py-1 rounded-full text-sm mt-2 bg-muted text-foreground">
              Image metadata
            </span>
          </div>
        </div>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(item)}
            className="text-muted-foreground hover:text-foreground mx-1"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
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
            <Trash className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {item.error && (
        <div className="mb-4 text-destructive text-sm">Error: {item.error}</div>
      )}

      {editingItem === item._id ? (
        <div className="space-y-4">
          {/* Title with Counter */}
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className="font-medium">Title:</span>
                <span
                  className={`text-sm ${
                    editData.title.length > metadataLimits.titleLength
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {editData.title.length}/{metadataLimits.titleLength} chars |{" "}
                  {countWords(editData.title)} words
                  {editData.title.length > metadataLimits.titleLength &&
                    " (Over limit)"}
                </span>
              </div>
              <div className="flex items-center mt-1">
                <div className="flex-grow">
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
          </div>

          {/* Description with Counter */}
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className="font-medium">Description:</span>
                <span
                  className={`text-sm ${
                    editData.description.length >
                    metadataLimits.descriptionLength
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {editData.description.length}/
                  {metadataLimits.descriptionLength} chars |{" "}
                  {countWords(editData.description)} words
                  {editData.description.length >
                    metadataLimits.descriptionLength && " (Over limit)"}
                </span>
              </div>
              <div className="flex items-start mt-1">
                <div className="flex-grow">
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
          </div>

          {/* Keywords with Counter */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Keywords:</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {editData.keywords.length}/{metadataLimits.keywordCount}{" "}
                  keywords
                </span>
              </div>
            </div>
            <div className="flex items-start mt-2">
              <div className="flex-grow">
                <Textarea
                  value={editData.keywords.join(", ")}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  onBlur={handleKeywordBlur}
                  className="w-full"
                  rows={3}
                  placeholder="Enter keywords separated by commas"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {editData.keywords.length}/{metadataLimits.keywordCount}{" "}
                  keywords
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Title with Counter */}
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className="font-medium flex-1">Title:</span>
                <span
                  className={`text-sm ${
                    item.metadata.title.length > metadataLimits.titleLength
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.metadata.title.length}/{metadataLimits.titleLength}{" "}
                  chars | {countWords(item.metadata.title)} words
                  {item.metadata.title.length > metadataLimits.titleLength &&
                    " (Over limit)"}
                </span>{" "}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyField(item.metadata.title, "Title")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedField === "Title" ? (
                    <Check className="h-5 w-5 text-success" />
                  ) : (
                    <Clipboard className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center mt-1">
                <p className="flex-grow">{item.metadata.title}</p>
              </div>
            </div>
          </div>

          {/* Description with Counter */}
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className="font-medium flex-1">Description:</span>
                <span
                  className={`text-sm ${
                    item.metadata.description.length >
                    metadataLimits.descriptionLength
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.metadata.description.length}/
                  {metadataLimits.descriptionLength} chars |{" "}
                  {countWords(item.metadata.description)} words
                  {item.metadata.description.length >
                    metadataLimits.descriptionLength && " (Over limit)"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleCopyField(item.metadata.description, "Description")
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedField === "Description" ? (
                    <Check className="h-5 w-5 text-success" />
                  ) : (
                    <Clipboard className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center mt-1">
                <p className="flex-grow">{item.metadata.description}</p>
              </div>
            </div>
          </div>

          {/* Keywords with Counter */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Keywords:</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
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
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedField === "Keywords" ? (
                    <Check className="h-5 w-5 text-success" />
                  ) : (
                    <Clipboard className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {item.metadata.keywords?.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
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
