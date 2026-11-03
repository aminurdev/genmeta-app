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
      const [year, month] = monthYear.split("-");
      return format(
        new Date(Number.parseInt(year), Number.parseInt(month) - 1),
        "MMM yyyy"
      );
    } catch {
      return monthYear;
    }
  };

  const formatDay = (dayOrDate?: string) => {
    if (!dayOrDate) return "";
    try {
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
      color={type === "monthly" ? "#8884d8" : "#82ca9d"}
      tooltipLabel="Processes"
      valueFormatter={(value) => value.toLocaleString()}
    />
  );
}
