"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  TooltipProps,
} from "recharts";

interface DataPoint {
  month: string;
  tokensPurchased: number;
  tokensUsed: number;
}

interface TokenUsageProps {
  data: DataPoint[];
}

export function TokenUsage({ data }: TokenUsageProps) {
  // Transform data to match the chart format
  const chartData = data.map((item) => ({
    name: item.month,
    purchased: item.tokensPurchased,
    used: item.tokensUsed,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          content={(props: TooltipProps<number, string>) => {
            const { active, payload, label } = props;
            if (active && payload && payload.length) {
              const purchasedValue = payload.find(
                (p) => p.dataKey === "purchased"
              )?.value;
              const usedValue = payload.find(
                (p) => p.dataKey === "used"
              )?.value;

              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="text-sm font-bold">{label}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Tokens Purchased
                      </span>
                      <span className="font-bold text-[#8884d8]">
                        {purchasedValue?.toLocaleString() ?? "0"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Tokens Used
                      </span>
                      <span className="font-bold text-[#82ca9d]">
                        {usedValue?.toLocaleString() ?? "0"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="purchased"
          fill="#8884d8"
          name="Tokens Purchased"
        />
        <Bar yAxisId="right" dataKey="used" fill="#82ca9d" name="Tokens Used" />
      </BarChart>
    </ResponsiveContainer>
  );
}
