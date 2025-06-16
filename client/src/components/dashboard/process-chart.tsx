"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { format } from "date-fns"

interface ProcessData {
  month: string
  count: number
}

interface ProcessChartProps {
  data: ProcessData[]
}

export function ProcessChart({ data }: ProcessChartProps) {
  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split("-")
    return format(new Date(Number.parseInt(year), Number.parseInt(month) - 1), "MMM yyyy")
  }

  const chartData = data.map((item) => ({
    month: formatMonthYear(item.month),
    count: item.count,
  }))

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
          <linearGradient id="colorProcess" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Month</span>
                      <span className="font-bold text-sm">{payload[0].payload.month}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Processes</span>
                      <span className="font-bold text-sm">{payload[0].value?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Area type="monotone" dataKey="count" stroke="#8884d8" fill="url(#colorProcess)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
