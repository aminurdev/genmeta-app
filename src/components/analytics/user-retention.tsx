"use client"

import { useState } from "react"

// Generate cohort data
const generateCohortData = () => {
  const cohorts = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"]
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  return cohorts.map((cohort, i) => {
    const row = { cohort, users: Math.floor(Math.random() * 500) + 100 }

    // Only generate retention data for periods that make sense for this cohort
    periods.slice(0, cohorts.length - i).forEach((period) => {
      // Retention generally decreases over time
      const baseRetention = Math.max(0, 100 - period * 10 - Math.random() * 15)
      row[`period${period}`] = Math.round(baseRetention)
    })

    return row
  })
}

const cohortData = generateCohortData()

// Color scale for the heatmap
const getColor = (value) => {
  if (value === undefined) return "#f3f4f6"
  if (value < 20) return "#fee2e2"
  if (value < 40) return "#fecaca"
  if (value < 60) return "#fca5a5"
  if (value < 80) return "#f87171"
  return "#ef4444"
}

export function UserRetention() {
  const [tooltip, setTooltip] = useState({ show: false, data: null, x: 0, y: 0 })

  const cellSize = 40
  const headerHeight = 30
  const headerWidth = 80

  return (
    <div className="relative overflow-auto">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${headerWidth + (cohortData[0] ? Object.keys(cohortData[0]).length * cellSize : 0)} ${headerHeight + cohortData.length * cellSize}`}
      >
        {/* Column headers */}
        <text
          x={headerWidth / 2}
          y={headerHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fontWeight="bold"
        >
          Cohort
        </text>
        <text
          x={headerWidth + cellSize / 2}
          y={headerHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fontWeight="bold"
        >
          Users
        </text>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((period, i) => (
          <text
            key={`period-${period}`}
            x={headerWidth + (i + 2) * cellSize + cellSize / 2}
            y={headerHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            fontWeight="bold"
          >
            P{period}
          </text>
        ))}

        {/* Row headers and data cells */}
        {cohortData.map((row, rowIndex) => (
          <g key={`row-${rowIndex}`}>
            {/* Cohort name */}
            <text
              x={headerWidth / 2}
              y={headerHeight + rowIndex * cellSize + cellSize / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
            >
              {row.cohort}
            </text>

            {/* Users count */}
            <text
              x={headerWidth + cellSize / 2}
              y={headerHeight + rowIndex * cellSize + cellSize / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
            >
              {row.users}
            </text>

            {/* Retention cells */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((period, colIndex) => {
              const value = row[`period${period}`]
              return value !== undefined ? (
                <g key={`cell-${rowIndex}-${colIndex}`}>
                  <rect
                    x={headerWidth + (colIndex + 2) * cellSize}
                    y={headerHeight + rowIndex * cellSize}
                    width={cellSize - 1}
                    height={cellSize - 1}
                    fill={getColor(value)}
                    rx={2}
                    ry={2}
                    onMouseEnter={(e) => {
                      setTooltip({
                        show: true,
                        data: {
                          cohort: row.cohort,
                          period,
                          value,
                        },
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }}
                    onMouseLeave={() => {
                      setTooltip({ show: false, data: null, x: 0, y: 0 })
                    }}
                  />
                  <text
                    x={headerWidth + (colIndex + 2) * cellSize + cellSize / 2}
                    y={headerHeight + rowIndex * cellSize + cellSize / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={10}
                    fill={value > 50 ? "white" : "black"}
                  >
                    {value}%
                  </text>
                </g>
              ) : null
            })}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip.show && tooltip.data && (
        <div
          className="absolute rounded-lg border bg-background p-2 shadow-sm text-xs"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 40,
            pointerEvents: "none",
          }}
        >
          <div className="font-bold">
            {tooltip.data.cohort} Cohort - Period {tooltip.data.period}
          </div>
          <div>{tooltip.data.value}% retention</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end mt-4 gap-2">
        <div className="text-xs text-muted-foreground">Retention:</div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#fee2e2]"></div>
          <span className="text-xs">0-20%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#fecaca]"></div>
          <span className="text-xs">20-40%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#fca5a5]"></div>
          <span className="text-xs">40-60%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#f87171]"></div>
          <span className="text-xs">60-80%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#ef4444]"></div>
          <span className="text-xs">80-100%</span>
        </div>
      </div>
    </div>
  )
}

