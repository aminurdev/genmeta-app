"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

const data = [
  { month: "Jan", newUsers: 120, totalUsers: 1200 },
  { month: "Feb", newUsers: 140, totalUsers: 1340 },
  { month: "Mar", newUsers: 180, totalUsers: 1520 },
  { month: "Apr", newUsers: 220, totalUsers: 1740 },
  { month: "May", newUsers: 280, totalUsers: 2020 },
  { month: "Jun", newUsers: 310, totalUsers: 2330 },
  { month: "Jul", newUsers: 350, totalUsers: 2680 },
  { month: "Aug", newUsers: 420, totalUsers: 3100 },
  { month: "Sep", newUsers: 480, totalUsers: 3580 },
  { month: "Oct", newUsers: 520, totalUsers: 4100 },
  { month: "Nov", newUsers: 580, totalUsers: 4680 },
  { month: "Dec", newUsers: 650, totalUsers: 5330 },
]

export function UserGrowth() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorTotalUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Month</span>
                      <span className="font-bold text-muted-foreground">{payload[0].payload.month}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">New Users</span>
                      <span className="font-bold">{payload[0].value}</span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Total Users</span>
                      <span className="font-bold">{payload[1].value}</span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="newUsers"
          stroke="#8884d8"
          fillOpacity={1}
          fill="url(#colorNewUsers)"
          name="New Users"
        />
        <Area
          type="monotone"
          dataKey="totalUsers"
          stroke="#82ca9d"
          fillOpacity={1}
          fill="url(#colorTotalUsers)"
          name="Total Users"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

