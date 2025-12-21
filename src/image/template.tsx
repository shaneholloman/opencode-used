// Main image template for OpenCode Wrapped

import { HEIGHT, WIDTH } from "../constants";
import type { OpenCodeStats } from "../types";
import { formatNumber, formatCost } from "../utils/format";
import { ActivityHeatmap } from "./heatmap";

// OpenCode color palette
const colors = {
  background: "#0D0D0D",
  surface: "#222",
  text: "#F1ECEC",
  textSecondary: "#eee",
  textMuted: "#9A9494",
};

interface TemplateProps {
  stats: OpenCodeStats;
}

export function WrappedTemplate({ stats }: TemplateProps) {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: "IBM Plex Mono",
        padding: 60,
        paddingTop: 80,
        paddingBottom: 80,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          opencode
        </span>
        <span
          style={{
            fontSize: 48,
            color: colors.textSecondary,
            fontWeight: 400,
          }}
        >
          wrapped {stats.year}
        </span>
      </div>
      {/* Days since first session */}
      <div
        style={{
          marginTop: 80,
          display: "flex",
          flexDirection: "row",
          gap: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Started
          </span>
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
            }}
          >
            {stats.daysSinceFirstSession} Days Ago
          </span>
        </div>
        {stats.mostActiveDay && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 24,
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              Most Active Day
            </span>
            <span
              style={{
                fontSize: 56,
                fontWeight: 700,
              }}
            >
              {stats.mostActiveDay.formattedDate}
            </span>
          </div>
        )}
      </div>

      {/* Activity Heatmap */}
      <div
        style={{
          marginTop: 60,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <span
          style={{
            fontSize: 24,
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Activity
        </span>
        <ActivityHeatmap dailyActivity={stats.dailyActivity} year={stats.year} maxStreakDays={stats.maxStreakDays} />
      </div>
      {/* Top Models & Providers - Side by Side */}
      <div
        style={{
          marginTop: 60,
          display: "flex",
          flexDirection: "row",
          gap: 40,
        }}
      >
        {/* Top Models */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            flex: 1,
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Top Models
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {stats.topModels.map((model, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: colors.textSecondary,
                    width: 40,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 500,
                  }}
                >
                  {model.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Providers */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            flex: 1,
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Providers
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {stats.topProviders.map((provider, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: colors.textSecondary,
                    width: 40,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 500,
                  }}
                >
                  {provider.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Stats Grid */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {stats.hasZenUsage ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* With Zen: 3 items on first row, 3 on second */}
            <div
              style={{
                display: "flex",
                gap: 20,
              }}
            >
              <StatBox label="Sessions" value={formatNumber(stats.totalSessions)} />
              <StatBox label="Messages" value={formatNumber(stats.totalMessages)} />
              <StatBox label="Tokens" value={formatNumber(stats.totalTokens)} />
            </div>
            <div
              style={{
                display: "flex",
                gap: 20,
              }}
            >
              <StatBox label="Projects" value={formatNumber(stats.totalProjects)} />
              <StatBox label="Streak" value={`${stats.maxStreak}d`} />
              <StatBox label="OpenCode Zen Cost" value={formatCost(stats.totalCost)} />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Without Zen: 3 on first row, 2 on second */}
            <div
              style={{
                display: "flex",
                gap: 20,
              }}
            >
              <StatBox label="Sessions" value={formatNumber(stats.totalSessions)} />
              <StatBox label="Messages" value={formatNumber(stats.totalMessages)} />
              <StatBox label="Tokens" value={formatNumber(stats.totalTokens)} />
            </div>
            <div
              style={{
                display: "flex",
                gap: 20,
              }}
            >
              <StatBox label="Projects" value={formatNumber(stats.totalProjects)} />
              <StatBox label="Streak" value={`${stats.maxStreak}d`} />
            </div>
          </div>
        )}
      </div>
      {/* Footer */}
      <div
        style={{
          marginTop: 60,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <span
          style={{
            fontSize: 24,
            color: colors.textMuted,
          }}
        >
          opencode.ai
        </span>
      </div>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
}

function StatBox({ label, value }: StatBoxProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.surface,
        padding: 28,
        paddingLeft: 32,
        paddingRight: 32,
        gap: 12,
        flex: 1,
        alignItems: "center",
        borderRadius: 12,
      }}
    >
      <span
        style={{
          fontSize: 24,
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 40,
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Export function for the generator
export function buildTemplate(stats: OpenCodeStats) {
  return <WrappedTemplate stats={stats} />;
}
