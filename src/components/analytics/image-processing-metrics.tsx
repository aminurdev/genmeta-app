"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"

const data = [
  { day: "Mon", processed: 240, failed: 12 },
  { day: "Tue", processed: 300, failed: 15 },
  { day: "Wed", processed: 420, failed: 8 },
  { day: "Thu", processed: 380, failed: 20 },
  { day: "Fri", processed: 450, failed: 25 },
  { day: "Sat", processed: 180, failed: 5 },
  { day: "Sun", processed: 150, failed: 3 },
]

export function ImageProcessingMetrics() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
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
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Processed</span>
                      <span className="font-bold text-[#8884d8]">{payload[0].value} images</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Failed</span>
                      <span className="font-bold text-[#FF8042]">{payload[1].value} images</span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Success Rate</span>
                      <span className="font-bold">
                        {Math.round(
                          (Number(payload[0].value) / (Number(payload[0].value) + Number(payload[1].value))) * 100,
                        )}
                        %
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
        <Bar dataKey="processed" fill="#8884d8" name="Processed Images" radius={[4, 4, 0, 0]} />
        <Bar dataKey="failed" fill="#FF8042" name="Failed Images" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

