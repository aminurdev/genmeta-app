"use client"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "@/components/ui/chart"

const data = [
  { name: "North America", value: 4200, color: "#8884d8" },
  { name: "Europe", value: 3800, color: "#83a6ed" },
  { name: "Asia", value: 2900, color: "#8dd1e1" },
  { name: "South America", value: 800, color: "#82ca9d" },
  { name: "Africa", value: 400, color: "#a4de6c" },
  { name: "Oceania", value: 250, color: "#d0ed57" },
]

export function GeographicDistribution() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Region</span>
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

