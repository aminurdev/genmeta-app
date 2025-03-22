/* eslint-disable @next/next/no-img-element */
import React from "react";
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
    keywordsCount: number;
    keywordLength: number;
    minKeywords: number;
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
    <div key={item._id} className="p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4">
          <img
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.imageName}
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div>
            <h3 className="font-medium text-gray-800">{item.imageName}</h3>
            <span className="inline-block px-2 py-1 rounded-full text-sm mt-2 bg-gray-100 text-gray-700">
              Image metadata
            </span>
          </div>
        </div>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(item)}
            className="text-gray-400 hover:text-gray-600 mx-1"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteDialogOpen(item._id)}
            disabled={loading}
            className={`text-gray-400 hover:text-red-500 transition-colors mx-1 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Delete"
          >
            <Trash className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {item.error && (
        <div className="mb-4 text-red-600 text-sm">Error: {item.error}</div>
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
                      ? "text-red-500 font-medium"
                      : "text-gray-500"
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
                        ? "border-red-300"
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
                      ? "text-red-500 font-medium"
                      : "text-gray-500"
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
                        ? "border-red-300"
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
                <span className="text-sm text-gray-500">
                  {editData.keywords.length}/{metadataLimits.keywordsCount}{" "}
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
                <div className="text-sm text-gray-500 mt-1">
                  {editData.keywords.length}/{metadataLimits.keywordsCount}{" "}
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
              className="bg-blue-600 hover:bg-blue-700"
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
                      ? "text-red-500 font-medium"
                      : "text-gray-500"
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copiedField === "Title" ? (
                    <Check className="h-5 w-5 text-green-600" />
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
                      ? "text-red-500 font-medium"
                      : "text-gray-500"
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copiedField === "Description" ? (
                    <Check className="h-5 w-5 text-green-600" />
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
                <span className="text-sm text-gray-500">
                  {item.metadata.keywords.length}/{metadataLimits.keywordsCount}{" "}
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copiedField === "Keywords" ? (
                    <Check className="h-5 w-5 text-green-600" />
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
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
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
