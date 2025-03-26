"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "@/components/ui/chart"

const data = [
  { name: "Admin", value: 15, color: "#8884d8" },
  { name: "Editor", value: 45, color: "#82ca9d" },
  { name: "Viewer", value: 240, color: "#ffc658" },
]

export function UserRoles() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
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
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Role</span>
                        <span className="font-bold text-muted-foreground">{payload[0].name}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Users</span>
                        <span className="font-bold">{payload[0].value}</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 flex justify-center gap-4">
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs">
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

