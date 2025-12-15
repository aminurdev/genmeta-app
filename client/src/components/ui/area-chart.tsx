"use client";

import {
    Area,
    AreaChart as RechartsAreaChart,
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
    valueFormatter?: (value: number) => string;
    yAxisFormatter?: (value: number) => string;
}

export function AreaChart({
    data,
    color = "#8884d8",
    tooltipLabel = "Value",
    valueFormatter = (value: number) => value.toLocaleString(),
    yAxisFormatter,
}: AreaChartProps) {
    const gradientId = `gradient-${color.replace("#", "")}`;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsAreaChart
                data={data}
                margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
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
                    tickFormatter={yAxisFormatter}
                />
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                Period
                                            </span>
                                            <span className="font-bold text-sm">
                                                {payload[0].payload.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                {tooltipLabel}
                                            </span>
                                            <span className="font-bold text-sm">
                                                {valueFormatter(payload[0].value as number)}
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
    );
}
