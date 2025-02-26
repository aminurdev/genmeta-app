import { ArrowDownTrayIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { MetadataResult } from "@/types";

interface DownloadButtonsProps {
  results: MetadataResult[];
  downloadInfo: { id: string; downloadable: boolean };
  isDownloading: { csv: boolean; images: boolean };
  onCSVDownload: () => void;
  onImageDownload: () => void;
}

export const DownloadButtons = ({
  downloadInfo,
  isDownloading,
  onCSVDownload,
  onImageDownload,
}: DownloadButtonsProps) => (
  <div className="flex gap-4">
    <button
      onClick={onCSVDownload}
      disabled={isDownloading.csv || isDownloading.images}
      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isDownloading.csv ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
      ) : (
        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
      )}
      Export CSV
    </button>
    <button
      onClick={onImageDownload}
      disabled={
        isDownloading.csv || isDownloading.images || !downloadInfo.downloadable
      }
      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isDownloading.images ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
      ) : (
        <PhotoIcon className="h-5 w-5 mr-2" />
      )}
      Download Images
    </button>
  </div>
);
