import { MetadataResult, EditingState } from "@/types";
import {
  PencilIcon,
  CheckIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { countWords } from "@/actions";
import Image from "next/image";

interface MetadataEditorProps {
  result: MetadataResult;
  editing: EditingState;
  editValue: string;
  setEditValue: (value: string) => void;
  startEditing: (
    id: string,
    field: "title" | "description" | "keywords",
    value: string | string[]
  ) => void;
  saveEdit: (id: string) => void;
  copyToClipboard: (text: string, field: string, id: string) => void;
  copyStatus: { [key: string]: boolean };
}

export const MetadataEditor = ({
  result,
  editing,
  editValue,
  setEditValue,
  startEditing,
  saveEdit,
  copyToClipboard,
  copyStatus,
}: MetadataEditorProps) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <div className="flex gap-6">
      <div className="w-48 h-48 flex-shrink-0 relative">
        <Image
          src={result.imageUrl || ""}
          width={300}
          height={300}
          alt={result.fileName}
          className="w-full h-full object-cover rounded-lg"
        />
        {result.status === "processing" && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-700 ellipsis-clamp">
            {result.fileName}
          </h3>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              result.status === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Title:</span>
            <span className="text-sm text-gray-500">
              {result.title.length} | {countWords(result.title)}
            </span>
          </div>
          {editing.id === result.id && editing.field === "title" ? (
            <div className="flex items-center mt-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-2 border rounded-lg mr-2"
              />
              <button
                onClick={() => saveEdit(result.id)}
                className="text-green-600 hover:text-green-700"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <p className="flex-grow text-sm">{result.title}</p>
              <div className="flex gap-2 ml-2">
                <button
                  onClick={() => startEditing(result.id, "title", result.title)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    copyToClipboard(result.title, "title", result.id)
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copyStatus[result.id + "title"] ? (
                    <CheckIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Description:</span>
            <span className="text-sm text-gray-500">
              {result.description.length} | {countWords(result.description)}
            </span>
          </div>
          {editing.id === result.id && editing.field === "description" ? (
            <div className="flex items-center mt-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-2 border rounded-lg mr-2"
              />
              <button
                onClick={() => saveEdit(result.id)}
                className="text-green-600 hover:text-green-700"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <p className="flex-grow text-sm">{result.description}</p>
              <div className="flex gap-2 ml-2">
                <button
                  onClick={() =>
                    startEditing(result.id, "description", result.description)
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    copyToClipboard(
                      result.description,
                      "description",
                      result.id
                    )
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copyStatus[result.id + "description"] ? (
                    <CheckIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Keywords:</span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {result.keywords.length} keywords
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    startEditing(result.id, "keywords", result.keywords)
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    copyToClipboard(
                      result.keywords.join(", "),
                      "keywords",
                      result.id
                    )
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copyStatus[result.id + "keywords"] ? (
                    <CheckIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          {editing.id === result.id && editing.field === "keywords" ? (
            <div className="flex items-center mt-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-2 border rounded-lg mr-2"
                placeholder="Comma-separated keywords"
              />
              <button
                onClick={() => saveEdit(result.id)}
                className="text-green-600 hover:text-green-700"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
