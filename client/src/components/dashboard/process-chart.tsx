"use client";

import { format } from "date-fns";
import { AreaChart } from "@/components/ui/area-chart";

interface ProcessData {
  month?: string;
  day?: string;
  count: number;
}

interface ProcessChartProps {
  data: ProcessData[];
  type: "monthly" | "daily";
}

export function ProcessChart({ data, type }: ProcessChartProps) {
  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    return format(
      new Date(Number.parseInt(year), Number.parseInt(month) - 1),
      "MMM yyyy"
    );
  };

  const formatDay = (day: string) => {
    return format(new Date(day), "MMM d");
  };

  const chartData = data.map((item) => ({
    label:
      type === "monthly" ? formatMonthYear(item.month!) : formatDay(item.day!),
    value: item.count,
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
