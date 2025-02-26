import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

interface FileUploadProps {
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileUpload = ({ onDrop, handleFileSelect }: FileUploadProps) => (
  <div
    onDrop={onDrop}
    onDragOver={(e) => e.preventDefault()}
    className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-8 text-center bg-white shadow-sm hover:border-primary transition-colors"
  >
    <ArrowUpTrayIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
    <p className="text-lg mb-4 text-gray-600">
      Drag and drop your images here, or
    </p>
    <label className="bg-primary text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors inline-block">
      Browse Files
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </label>
    <p className="mt-2 text-sm text-gray-500">
      Supported formats: JPEG, PNG, WebP
    </p>
  </div>
);
