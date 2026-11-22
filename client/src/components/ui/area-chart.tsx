"use client";

import { useId } from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AreaChartData {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaChartData[];
  color?: string;
  tooltipLabel?: string;
  height?: number;
  yAxisWidth?: number;
  emptyMessage?: string;
  valueFormatter?: (value: number) => string;
  yAxisFormatter?: (value: number) => string;
}

export function AreaChart({
  data,
  color = "#8884d8",
  tooltipLabel = "Value",
  height = 280,
  yAxisWidth = 48,
  emptyMessage = "No activity recorded in this window",
  valueFormatter = (value: number) => value.toLocaleString(),
  yAxisFormatter,
}: AreaChartProps) {
  const reactId = useId();
  const gradientId = `gradient-${reactId.replace(/:/g, "")}`;

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full min-w-0 flex items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <RechartsAreaChart
          data={data}
          margin={{
            top: 10,
            right: 12,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-border/60"
          />
          <XAxis
            dataKey="label"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={yAxisWidth}
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            domain={[0, (dataMax: number) => Math.max(dataMax, 4)]}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2.5 shadow-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Period
                        </span>
                        <span className="font-semibold text-sm">
                          {payload[0].payload.label}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {tooltipLabel}
                        </span>
                        <span className="font-semibold text-sm">
                          {valueFormatter(Number(payload[0].value ?? 0))}
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
            dataKey="value"
            stroke={color}
            fill={`url(#${gradientId})`}
            strokeWidth={2}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
