// Stats calculator - transforms raw data into statistics

import type { SessionData, MessageData, OpenCodeStats, ModelStats, ProviderStats } from "./types";
import { collectSessions, collectMessages, collectAllSessions, collectProjects } from "./collector";

export async function calculateStats(year: number): Promise<OpenCodeStats> {
  // Collect data for the specified year
  const sessions = await collectSessions(year);
  const messages = await collectMessages(year);
  const projects = await collectProjects();

  // Get all sessions ever to find first session date
  const allSessions = await collectAllSessions();

  // Find first session date (ever, not just this year)
  // Guard against empty sessions array - Math.min() returns Infinity with no arguments
  let firstSessionDate: Date;
  let daysSinceFirstSession: number;

  if (allSessions.length === 0) {
    firstSessionDate = new Date();
    daysSinceFirstSession = 0;
  } else {
    const firstSessionTimestamp = Math.min(...allSessions.map((s) => s.time.created));
    firstSessionDate = new Date(firstSessionTimestamp);
    daysSinceFirstSession = Math.floor((Date.now() - firstSessionTimestamp) / (1000 * 60 * 60 * 24));
  }

  // Count sessions, messages, and projects
  const totalSessions = sessions.length;
  const totalMessages = messages.length;
  const totalProjects = projects.length;

  // Calculate tokens
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const message of messages) {
    if (message.tokens) {
      totalInputTokens += message.tokens.input || 0;
      totalOutputTokens += message.tokens.output || 0;
    }
  }

  const totalTokens = totalOutputTokens;

  // Calculate cost (only from opencode/zen provider)
  let totalCost = 0;
  let hasZenUsage = false;

  for (const message of messages) {
    if (message.providerID === "opencode" && message.cost) {
      totalCost += message.cost;
      hasZenUsage = true;
    }
  }

  // Calculate model stats
  const modelCounts = new Map<string, number>();
  for (const message of messages) {
    if (message.modelID && message.role === "assistant") {
      const count = modelCounts.get(message.modelID) || 0;
      modelCounts.set(message.modelID, count + 1);
    }
  }

  const totalModelUsage = Array.from(modelCounts.values()).reduce((a, b) => a + b, 0);
  const topModels: ModelStats[] = Array.from(modelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name: formatModelName(name),
      count,
      percentage: Math.round((count / totalModelUsage) * 100),
    }))
    .slice(0, 3);

  // Calculate provider stats
  const providerCounts = new Map<string, number>();
  for (const message of messages) {
    if (message.providerID && message.role === "assistant") {
      const count = providerCounts.get(message.providerID) || 0;
      providerCounts.set(message.providerID, count + 1);
    }
  }

  const totalProviderUsage = Array.from(providerCounts.values()).reduce((a, b) => a + b, 0);
  const topProviders: ProviderStats[] = Array.from(providerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({
      name: formatProviderName(name),
      count,
      percentage: Math.round((count / totalProviderUsage) * 100),
    }));

  // Calculate daily activity for heatmap
  const dailyActivity = new Map<string, number>();
  for (const message of messages) {
    const date = new Date(message.time.created);
    const dateKey = formatDateKey(date);
    const count = dailyActivity.get(dateKey) || 0;
    dailyActivity.set(dateKey, count + 1);
  }

  // Calculate streaks
  const { maxStreak, currentStreak, maxStreakDays } = calculateStreaks(dailyActivity, year);

  // Find most active day
  const mostActiveDay = findMostActiveDay(dailyActivity);

  return {
    year,
    firstSessionDate,
    daysSinceFirstSession,
    totalSessions,
    totalMessages,
    totalProjects,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCost,
    hasZenUsage,
    topModels,
    topProviders,
    maxStreak,
    currentStreak,
    maxStreakDays,
    dailyActivity,
    mostActiveDay,
  };
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatModelName(name: string): string {
  // Format model names to be more readable
  const nameMap: Record<string, string> = {
    "claude-opus-4.5": "Claude Opus 4.5",
    "claude-sonnet-4.5": "Claude Sonnet 4.5",
    "claude-sonnet-4": "Claude Sonnet 4",
    "claude-haiku-4.5": "Claude Haiku 4.5",
    "claude-haiku-4-5": "Claude Haiku 4.5",
    "claude-sonnet-4-5": "Claude Sonnet 4.5",
    "claude-opus-4-5-thinking": "Claude Opus 4.5 Thinking",
    "claude-opus-4-1": "Claude Opus 4.1",
    "gpt-5": "GPT-5",
    "gpt-5-codex": "GPT-5 Codex",
    "gpt-5.1": "GPT-5.1",
    "gpt-5.1-codex": "GPT-5.1 Codex",
    "grok-code": "Grok Code",
    "grok-code-fast-1": "Grok Code Fast",
    "kimi-k2": "Kimi K2",
    "big-pickle": "Big Pickle",
    "glm-4.6": "GLM 4.6",
    "code-supernova": "Code Supernova",
    "gemini-2.5-pro": "Gemini 2.5 Pro",
    "gemini-3-pro-preview": "Gemini 3 Pro",
  };

  return nameMap[name] || name;
}

function formatProviderName(name: string): string {
  const nameMap: Record<string, string> = {
    "github-copilot": "GitHub Copilot",
    opencode: "OpenCode Zen",
    google: "Google AI",
    anthropic: "Anthropic",
    openai: "OpenAI",
  };

  return nameMap[name] || name;
}

function calculateStreaks(dailyActivity: Map<string, number>, year: number): { maxStreak: number; currentStreak: number; maxStreakDays: Set<string> } {
  // Get all active dates sorted
  const activeDates = Array.from(dailyActivity.keys())
    .filter((date) => date.startsWith(String(year)))
    .sort();

  if (activeDates.length === 0) {
    return { maxStreak: 0, currentStreak: 0, maxStreakDays: new Set() };
  }

  let maxStreak = 1;
  let currentStreak = 1;
  let tempStreak = 1;
  let tempStreakStart = 0;
  let maxStreakStart = 0;
  let maxStreakEnd = 0;

  for (let i = 1; i < activeDates.length; i++) {
    const prevDate = new Date(activeDates[i - 1]);
    const currDate = new Date(activeDates[i]);

    // Calculate difference in days
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
        maxStreakStart = tempStreakStart;
        maxStreakEnd = i;
      }
    } else {
      tempStreak = 1;
      tempStreakStart = i;
    }
  }

  // Build the set of max streak days
  const maxStreakDays = new Set<string>();
  for (let i = maxStreakStart; i <= maxStreakEnd; i++) {
    maxStreakDays.add(activeDates[i]);
  }

  // Calculate current streak (from today backwards)
  const today = formatDateKey(new Date());
  const yesterday = formatDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

  if (dailyActivity.has(today)) {
    currentStreak = 1;
    let checkDate = new Date();

    while (true) {
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      const checkKey = formatDateKey(checkDate);

      if (dailyActivity.has(checkKey)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else if (dailyActivity.has(yesterday)) {
    currentStreak = 1;
    let checkDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    while (true) {
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      const checkKey = formatDateKey(checkDate);

      if (dailyActivity.has(checkKey)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  return { maxStreak, currentStreak, maxStreakDays };
}

function findMostActiveDay(dailyActivity: Map<string, number>): { date: string; count: number; formattedDate: string } | null {
  if (dailyActivity.size === 0) {
    return null;
  }

  let maxDate = "";
  let maxCount = 0;

  for (const [date, count] of dailyActivity.entries()) {
    if (count > maxCount) {
      maxCount = count;
      maxDate = date;
    }
  }

  if (!maxDate) {
    return null;
  }

  // Parse date string (YYYY-MM-DD) and format as "Mon D"
  const [year, month, day] = maxDate.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedDate = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;

  return {
    date: maxDate,
    count: maxCount,
    formattedDate,
  };
}
