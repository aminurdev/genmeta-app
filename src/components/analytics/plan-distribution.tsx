"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "@/components/ui/chart"

const data = [
  { name: "Free Plan", value: 540, color: "#8884d8" },
  { name: "Basic Plan", value: 620, color: "#83a6ed" },
  { name: "Pro Plan", value: 210, color: "#8dd1e1" },
  { name: "Enterprise Plan", value: 75, color: "#82ca9d" },
]

export function PlanDistribution() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Plan</span>
                      <span className="font-bold text-muted-foreground">{payload[0].name}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Users</span>
                      <span className="font-bold">{payload[0].value}</span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Percentage</span>
                      <span className="font-bold">
                        {((payload[0].value / data.reduce((sum, entry) => sum + entry.value, 0)) * 100).toFixed(1)}%
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
      </PieChart>
    </ResponsiveContainer>
  )
}

