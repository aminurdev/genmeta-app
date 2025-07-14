"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";

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
    count: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient
            id={`colorProcess-${type}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="5%"
              stopColor={type === "monthly" ? "#8884d8" : "#82ca9d"}
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor={type === "monthly" ? "#8884d8" : "#82ca9d"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {type === "monthly" ? "Month" : "Day"}
                      </span>
                      <span className="font-bold text-sm">
                        {payload[0].payload.label}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Processes
                      </span>
                      <span className="font-bold text-sm">
                        {payload[0].value?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={type === "monthly" ? "#8884d8" : "#82ca9d"}
          fill={`url(#colorProcess-${type})`}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
