"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"

const data = [
  { month: "Jan", revenue: 4000, target: 4500 },
  { month: "Feb", revenue: 4200, target: 4500 },
  { month: "Mar", revenue: 4800, target: 5000 },
  { month: "Apr", revenue: 5200, target: 5000 },
  { month: "May", revenue: 5800, target: 5500 },
  { month: "Jun", revenue: 6000, target: 5500 },
  { month: "Jul", revenue: 6500, target: 6000 },
  { month: "Aug", revenue: 7000, target: 6000 },
  { month: "Sep", revenue: 7200, target: 6500 },
  { month: "Oct", revenue: 7800, target: 6500 },
  { month: "Nov", revenue: 8200, target: 7000 },
  { month: "Dec", revenue: 9000, target: 7000 },
]

export function RevenueAnalytics() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="text-sm font-bold">{label}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Revenue</span>
                      <span className="font-bold text-[#8884d8]">${payload[0].value?.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Target</span>
                      <span className="font-bold text-[#82ca9d]">${payload[1].value?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Bar dataKey="revenue" fill="#8884d8" name="Revenue" radius={[4, 4, 0, 0]} />
        <Bar dataKey="target" fill="#82ca9d" name="Target" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

