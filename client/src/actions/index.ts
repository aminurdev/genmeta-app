import { getAccessToken, getBaseApi } from "@/services/image-services";
import { Metadata } from "@/types/metadata";
import { toast } from "sonner";

export const handleDownloadZip = async (batchId: string) => {
  if (!batchId) return;

  try {
    const baseAPi = await getBaseApi();
    const accessToken = await getAccessToken();

    // Create a direct download link with token
    const downloadURL = `${baseAPi}/images/download/${batchId}?token=${accessToken}`;

    // Create a temporary link element and trigger download
    const link = document.createElement("a");
    link.href = downloadURL;
    link.setAttribute("download", `images_${batchId}.zip`);
    // link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast("ZIP file download started");
  } catch (error) {
    console.error("Error downloading ZIP:", error);
    toast(error instanceof Error ? error.message : "Failed to download images");
  }
};

export const fetchImageMetadata = async (batchId: string) => {
  if (!batchId) {
    toast.error("Batch ID is required");
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const baseApi = await getBaseApi();

    const response = await fetch(`${baseApi}/images/metadata/${batchId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch metadata");
    }

    const data = await response.json();
    return data.data.metadata;
  } catch (error) {
    console.error("Error fetching metadata:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to fetch metadata"
    );
  }
};

export async function updateBatchName(batchId: string, newName: string) {
  try {
    const accessToken = await getAccessToken();
    const baseApi = await getBaseApi();
    const response = await fetch(
      `${baseApi}/images/batches/rename/${batchId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: newName }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update batch name");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating batch name:", error);
    throw error;
  }
}

export const handleDownloadCSV = async (batchId: string) => {
  const metadata = await fetchImageMetadata(batchId);
  const csvRows = [
    "Filename,Title,Description,Keywords",
    ...metadata.map(
      (item: Metadata) =>
        `"${item.imageName}","${item.metadata.title.replace(
          /"/g,
          '""'
        )}","${item.metadata.description.replace(
          /"/g,
          '""'
        )}","${item.metadata.keywords.join(", ")}"`
    ),
  ].join("\n");

  const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `image_metadata_${batchId}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
