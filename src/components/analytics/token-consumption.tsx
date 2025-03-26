"use client"

import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

const data = [
  { day: "Mon", usage: 4000, limit: 10000 },
  { day: "Tue", usage: 5000, limit: 10000 },
  { day: "Wed", usage: 7000, limit: 10000 },
  { day: "Thu", usage: 6000, limit: 10000 },
  { day: "Fri", usage: 8000, limit: 10000 },
  { day: "Sat", usage: 3500, limit: 10000 },
  { day: "Sun", usage: 2800, limit: 10000 },
]

export function TokenConsumption() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="text-sm font-bold">{label}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Usage</span>
                      <span className="font-bold text-[#8884d8]">{payload[0].value?.toLocaleString()} tokens</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Limit</span>
                      <span className="font-bold text-[#82ca9d]">{payload[1].value?.toLocaleString()} tokens</span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Utilization</span>
                      <span className="font-bold">
                        {Math.round((Number(payload[0].value) / Number(payload[1].value)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="usage" stroke="#8884d8" name="Token Usage" strokeWidth={2} />
        <Line
          type="monotone"
          dataKey="limit"
          stroke="#82ca9d"
          name="Daily Limit"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

