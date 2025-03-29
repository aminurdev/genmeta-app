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

export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const secondsElapsed = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (secondsElapsed < 60)
    return `${secondsElapsed} second${secondsElapsed !== 1 ? "s" : ""} ago`;

  const minutesElapsed = Math.floor(secondsElapsed / 60);
  if (minutesElapsed < 60)
    return `${minutesElapsed} minute${minutesElapsed !== 1 ? "s" : ""} ago`;

  const hoursElapsed = Math.floor(minutesElapsed / 60);
  if (hoursElapsed < 24)
    return `${hoursElapsed} hour${hoursElapsed !== 1 ? "s" : ""} ago`;

  const daysElapsed = Math.floor(hoursElapsed / 24);
  if (daysElapsed === 1) return "yesterday";

  return past.toISOString().split("T")[0];
}

// Example usage
console.log(formatTimeAgo("2025-03-28T16:18:26.948Z"));

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
