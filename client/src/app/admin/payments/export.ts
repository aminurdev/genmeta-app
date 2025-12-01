import { DownloadPaymentHistory } from "@/types/admin";

/**
 * Escapes CSV field values to handle commas, quotes, and newlines
 */
const escapeCsvField = (field: string | Date | number): string => {
  if (field === null || field === undefined) return "";

  const stringValue = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Formats date to a readable string format
 */

/**
 * Converts payment history data to CSV format
 */
export const convertToCSV = (data: DownloadPaymentHistory["data"]): string => {
  if (!data || data.length === 0) {
    throw new Error("No data available for export");
  }

  // Define CSV headers
  const headers = [
    "Name",
    "Email",
    "Phone Number",
    "Amount",
    "Transaction ID",
    "Payment ID",
    "Payment Create Time",
    "Payment Execute Time",
  ];

  // Create CSV header row
  const headerRow = headers.map((header) => escapeCsvField(header)).join(",");

  // Create CSV data rows
  const dataRows = data.map((record) => {
    const row = [
      escapeCsvField(record.name || ""),
      escapeCsvField(record.email || ""),
      escapeCsvField(record.paymentNumber || ""),

      escapeCsvField(record.amount || ""),
      escapeCsvField(record.trxID || ""),
      escapeCsvField(record.paymentID || ""),
      escapeCsvField(record.paymentCreatedAt || ""),
      escapeCsvField(record.paymentExecuteTime || ""),
    ];
    return row.join(",");
  });

  return [headerRow, ...dataRows].join("\n");
};

/**
 * Triggers CSV file download in browser
 */
export const downloadCSVFile = (csvContent: string, filename: string): void => {
  try {
    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

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

    // Clean up the object URL
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

/**
 * Builds query parameters for API request
 */
export const buildQueryParams = (startDate?: Date, endDate?: Date): string => {
  const params = new URLSearchParams();

  if (startDate) {
    params.append("startDate", startDate.toISOString());
  }

  if (endDate) {
    params.append("endDate", endDate.toISOString());
  }

  return params.toString();
};
