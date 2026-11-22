/**
 * Triggers CSV file download in browser with UTF-8 BOM
 */
export const downloadCSVFile = (csvContent: string, filename: string): void => {
  try {
    const BOM = "\uFEFF";
    const csvWithBOM = csvContent.startsWith(BOM)
      ? csvContent
      : BOM + csvContent;

    const blob = new Blob([csvWithBOM], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading CSV file:", error);
    throw new Error("Failed to download CSV file");
  }
};

/**
 * Generates filename with timestamp
 */
export const generateFilename = (startDate?: Date, endDate?: Date): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");

  if (startDate && endDate) {
    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);
    return `payment-history_${start}_to_${end}_${timestamp}.csv`;
  }

  return `payment-history_${timestamp}.csv`;
};
