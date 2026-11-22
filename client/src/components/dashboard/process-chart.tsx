"use client";

import { format } from "date-fns";
import { AreaChart } from "@/components/ui/area-chart";

interface ProcessData {
  month?: string;
  day?: string;
  date?: string;
  count: number;
}

interface ProcessChartProps {
  data: ProcessData[];
  type: "monthly" | "daily";
}

export function ProcessChart({ data, type }: ProcessChartProps) {
  const formatMonthYear = (monthYear?: string) => {
    if (!monthYear) return "";
    try {
      const [yearStr, monthStr] = monthYear.split("-");
      const year = Number.parseInt(yearStr, 10);
      const month = Number.parseInt(monthStr, 10);
      if (!Number.isFinite(year) || !Number.isFinite(month)) return monthYear;
      return format(new Date(year, month - 1, 1), "MMM yyyy");
    } catch {
      return monthYear;
    }
  };

  const formatDay = (dayOrDate?: string) => {
    if (!dayOrDate) return "";
    try {
      const parts = dayOrDate.split("-").map((part) => Number.parseInt(part, 10));
      if (parts.length === 3 && parts.every(Number.isFinite)) {
        const [year, month, day] = parts;
        return format(new Date(year, month - 1, day), "MMM d");
      }
      return format(new Date(dayOrDate), "MMM d");
    } catch {
      return dayOrDate;
    }
  };

  const chartData = (data || []).map((item) => ({
    label:
      type === "monthly"
        ? formatMonthYear(item.month)
        : formatDay(item.day || item.date),
    value: item.count || 0,
  }));

  return (
    <AreaChart
      data={chartData}
      height={280}
      color={type === "monthly" ? "#8884d8" : "#10b981"}
      tooltipLabel="Processes"
      valueFormatter={(value) => value.toLocaleString()}
    />
  );
}
