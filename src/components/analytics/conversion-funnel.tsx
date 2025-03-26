"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"

const data = [
  { stage: "Visitors", count: 10000 },
  { stage: "Sign Ups", count: 2500 },
  { stage: "Free Trial", count: 1800 },
  { stage: "Basic Plan", count: 800 },
  { stage: "Pro Plan", count: 350 },
  { stage: "Enterprise", count: 120 },
]

export function ConversionFunnel() {
  // Calculate conversion rates between stages
  const stagesWithRates = data.map((stage, index) => {
    if (index === 0) return { ...stage, rate: 100 }
    const previousStage = data[index - 1]
    const rate = (stage.count / previousStage.count) * 100
    return { ...stage, rate }
  })

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted" />
          <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            dataKey="stage"
            type="category"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const stageData = stagesWithRates.find((s) => s.stage === label)
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="text-sm font-bold">{label}</div>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Count</span>
                        <span className="font-bold">{payload[0].value?.toLocaleString()}</span>
                      </div>
                      {stageData?.rate !== 100 && (
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Conversion from previous
                          </span>
                          <span className="font-bold">{stageData?.rate.toFixed(1)}%</span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Overall conversion</span>
                        <span className="font-bold">{((payload[0].value / data[0].count) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stagesWithRates.map((stage, index) => (
          <div key={stage.stage} className="rounded-lg border p-3">
            <div className="text-sm font-medium">{stage.stage}</div>
            <div className="text-2xl font-bold mt-1">{stage.count.toLocaleString()}</div>
            {index > 0 && (
              <div className="text-xs text-muted-foreground mt-1">{stage.rate.toFixed(1)}% from previous</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

