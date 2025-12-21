// Activity heatmap component for Satori

import type { OpenCodeStats } from "../types";
import { generateWeeksForYear, getIntensityLevel } from "../utils/dates";

// OpenCode style colors - grayscale with increasing brightness
const HEATMAP_COLORS = {
  0: "#1A1A1A", // No activity (dark surface)
  1: "#4B4646", // Low activity (muted)
  2: "#656363", // Medium-low
  3: "#B7B1B1", // Medium-high
  4: "#F1ECEC", // High activity (bright white)
} as const;

// Accent colors for streak days (based on #6cc644)
const STREAK_COLORS = {
  0: "#1a1f1a", // No activity (dark with green tint)
  1: "#2d4a2a", // Low activity
  2: "#3f7a35", // Medium-low
  3: "#56a03d", // Medium-high
  4: "#6cc644", // High activity (accent green)
} as const;

interface HeatmapProps {
  dailyActivity: Map<string, number>;
  year: number;
  maxStreakDays?: Set<string>;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ActivityHeatmap({ dailyActivity, year, maxStreakDays }: HeatmapProps) {
  const weeks = generateWeeksForYear(year);

  // Calculate max count for intensity scaling
  const counts = Array.from(dailyActivity.values());
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;

  // Cell size and gap
  const cellSize = 22;
  const gap = 3;
  const legendCellSize = 14;

  // Calculate month label positions
  const monthLabels = getMonthLabels(weeks, cellSize, gap);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Month labels */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          position: "relative",
          height: 20,
        }}
      >
        {monthLabels.map(({ month, x }) => (
          <div
            key={`${month}-${x}`}
            style={{
              position: "absolute",
              left: x,
              fontSize: 14,
              color: "#8A8F98",
              fontFamily: "IBM Plex Mono",
            }}
          >
            {MONTHS[month]}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: gap,
          flexWrap: "wrap",
          maxWidth: "100%",
        }}
      >
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: gap,
            }}
          >
            {week.map((dateStr, dayIndex) => {
              const count = dateStr ? dailyActivity.get(dateStr) || 0 : 0;
              const intensity = getIntensityLevel(count, maxCount);
              const isStreakDay = dateStr && maxStreakDays?.has(dateStr);
              const colorPalette = isStreakDay ? STREAK_COLORS : HEATMAP_COLORS;
              const color = colorPalette[intensity];

              return (
                <div
                  key={dayIndex}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: dateStr ? color : "transparent",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                ></div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "#8A8F98",
            fontFamily: "IBM Plex Mono",
          }}
        >
          Less
        </span>
        {[0, 1, 2, 3, 4].map((intensity) => (
          <div
            key={intensity}
            style={{
              width: legendCellSize,
              height: legendCellSize,
              backgroundColor: HEATMAP_COLORS[intensity as keyof typeof HEATMAP_COLORS],
              borderRadius: 3,
            }}
          />
        ))}
        <span
          style={{
            fontSize: 12,
            color: "#8A8F98",
            fontFamily: "IBM Plex Mono",
          }}
        >
          More
        </span>
      </div>
    </div>
  );
}

// Calculate x positions for month labels based on first week of each month
function getMonthLabels(weeks: (string | null)[][], cellSize: number, gap: number): { month: number; x: number }[] {
  const labels: { month: number; x: number }[] = [];
  let lastMonth = -1;

  for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
    const week = weeks[weekIndex];
    // Find first valid date in this week
    for (const dateStr of week) {
      if (dateStr) {
        const month = parseInt(dateStr.split("-")[1], 10) - 1;
        if (month !== lastMonth) {
          labels.push({
            month,
            x: weekIndex * (cellSize + gap),
          });
          lastMonth = month;
        }
        break;
      }
    }
  }

  return labels;
}
