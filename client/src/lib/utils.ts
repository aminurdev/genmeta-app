import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
};
export const formatDate = (date: string): string => {
  if (!date) return "-";

  const today = new Date();
  const givenDate = new Date(date);

  // Check if the given date is today
  const isToday = today.toDateString() === givenDate.toDateString();

  // Check if the given date is yesterday
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = yesterday.toDateString() === givenDate.toDateString();

  if (isToday) {
    return `Today, ${givenDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } else if (isYesterday) {
    return "Yesterday";
  } else {
    return givenDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
