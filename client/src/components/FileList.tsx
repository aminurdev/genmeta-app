import { XMarkIcon } from "@heroicons/react/24/outline";

interface FileListProps {
  files: File[];
  previews: { [key: string]: string };
  removeFile: (index: number) => void;
  processFiles: () => void;
  processing: boolean;
}

export const FileList = ({
  files,
  previews,
  removeFile,
  processFiles,
  processing,
}: FileListProps) => (
  <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
    <h2 className="text-xl font-semibold mb-4 text-gray-800">Selected Files</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {files.map((file, index) => (
        <div
          key={index}
          className="flex items-center p-3 bg-gray-50 rounded-lg"
        >
          <div className="w-20 h-20 mr-3 flex-shrink-0">
            {previews[file.name] && (
              <img
                src={previews[file.name]}
                alt={file.name}
                className="w-full h-full object-cover rounded-lg"
              />
            )}
          </div>
          <div className="flex-grow">
            <span className="text-gray-700 break-all">{file.name}</span>
          </div>
          <button
            onClick={() => removeFile(index)}
            className="text-gray-400 hover:text-red-500 transition-colors ml-2"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
    <button
      onClick={processFiles}
      disabled={processing}
      className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed w-full"
    >
      {processing ? "Processing..." : "Generate Metadata"}
    </button>
  </div>
);
