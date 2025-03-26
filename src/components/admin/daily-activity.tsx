"use client";

import { useState } from "react";

// Generate activity data for a month (30 days x 24 hours)
const generateData = () => {
  const data = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate 4 weeks of data
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // More activity during business hours
        let value = Math.floor(Math.random() * 100);
        if (hour >= 9 && hour <= 17 && day >= 1 && day <= 5) {
          value = Math.floor(Math.random() * 100) + 50;
        }

        data.push({
          day: days[day],
          hour,
          week,
          value,
        });
      }
    }
  }

  return data;
};

const activityData = generateData();

const getColor = (value: number): string => {
  if (value < 30) return "#f3f4f6";
  if (value < 60) return "#93c5fd";
  if (value < 90) return "#3b82f6";
  return "#1d4ed8";
};

export function DailyActivity() {
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    data: { day: string; hour: number; week: number; value: number } | null;
    x: number;
    y: number;
  }>({ show: false, data: null, x: 0, y: 0 });

  const cellSize = 12;
  const margin = { top: 40, right: 20, bottom: 20, left: 40 };
  const width = 7 * 24 * cellSize + margin.left + margin.right;
  const height = 4 * 7 * cellSize + margin.top + margin.bottom;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="relative overflow-auto">
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Hour labels (top) */}
          {hours.map((hour, i) => (
            <text
              key={`hour-${hour}`}
              x={i * cellSize + cellSize / 2}
              y={-10}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              className="text-muted-foreground"
            >
              {hour}
            </text>
          ))}

          {/* Day labels (left side) */}
          {days.map((day, i) => (
            <text
              key={`day-${day}`}
              x={-5}
              y={i * cellSize + cellSize / 2 + 3}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              className="text-muted-foreground"
            >
              {day}
            </text>
          ))}

          {/* Week labels */}
          {[0, 1, 2, 3].map((week) => (
            <text
              key={`week-${week}`}
              x={-25}
              y={week * 7 * cellSize + 3 * cellSize}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              className="text-muted-foreground"
            >
              W{week + 1}
            </text>
          ))}

          {/* Activity cells */}
          {activityData.map((d, i) => {
            const x = hours.indexOf(d.hour) * cellSize;
            const y = (days.indexOf(d.day) + d.week * 7) * cellSize;

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={cellSize - 1}
                height={cellSize - 1}
                fill={getColor(d.value)}
                rx={2}
                ry={2}
                onMouseEnter={(e) => {
                  setTooltip({
                    show: true,
                    data: d,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onMouseLeave={() => {
                  setTooltip({ show: false, data: null, x: 0, y: 0 });
                }}
              />
            );
          })}
        </g>
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
            {tooltip.data.day}, Week {tooltip.data.week + 1},{" "}
            {tooltip.data.hour}:00
          </div>
          <div>{tooltip.data.value} images processed</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end mt-4 gap-2">
        <div className="text-xs text-muted-foreground">Activity:</div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#f3f4f6]"></div>
          <span className="text-xs">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#93c5fd]"></div>
          <span className="text-xs">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#3b82f6]"></div>
          <span className="text-xs">High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#1d4ed8]"></div>
          <span className="text-xs">Very High</span>
        </div>
      </div>
    </div>
  );
}
