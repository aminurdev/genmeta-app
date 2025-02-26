import { MetadataResult } from "@/types";
import toast from "react-hot-toast";

type DownloadState = {
  csv: boolean;
  images: boolean;
};

type SetDownloadingState = React.Dispatch<React.SetStateAction<DownloadState>>;

export const downloadCSV = async (
  results: MetadataResult[],
  setDownloading: SetDownloadingState
) => {
  if (!results.length) return;

  setDownloading((prev) => ({ ...prev, csv: true }));

  try {
    const headers = [
      "File Name",
      "Title",
      "Description",
      "Keywords",
      "Image URL",
    ];
    const csvContent = [
      headers,
      ...results.map((result) => [
        result.fileName,
        result.title,
        result.description,
        result.keywords.join(", "),
        result.imageUrl || "",
      ]),
    ]
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `metadata_export_${new Date().toISOString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    setDownloading((prev) => ({ ...prev, csv: false }));
  }
};

export const downloadImagesAsZip = async (
  id: string,
  downloadable: boolean,
  setDownloading: SetDownloadingState
) => {
  if (!downloadable) {
    toast.error("Images not ready for download");
    return;
  }

  setDownloading((prev) => ({ ...prev, images: true }));

  try {
    const response = await fetch(`/api/images/download/${id}`);

    if (response.status === 404 || response.status === 500) {
      throw new Error("Download URL is not valid");
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error("Downloaded file is empty");
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `images_${new Date().toISOString()}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  } catch (error) {
    console.error("Failed to download images:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to download images"
    );
  } finally {
    setDownloading((prev) => ({ ...prev, images: false }));
  }
};

export const countWords = (str: string) => {
  return str
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};
