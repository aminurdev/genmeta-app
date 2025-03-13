import { getAccessToken, getBaseApi } from "@/services/image-services";
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
