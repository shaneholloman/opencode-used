// Types for OpenCode Wrapped

export interface SessionData {
  id: string;
  version: string;
  projectID: string;
  directory: string;
  title: string;
  time: {
    created: number;
    updated: number;
  };
  summary?: {
    additions: number;
    deletions: number;
    files: number;
  };
}

export interface MessageData {
  id: string;
  sessionID: string;
  role: "user" | "assistant";
  time: {
    created: number;
    completed?: number;
  };
  parentID?: string;
  modelID?: string;
  providerID?: string;
  mode?: string;
  agent?: string;
  cost?: number;
  tokens?: {
    input: number;
    output: number;
    reasoning: number;
    cache: {
      read: number;
      write: number;
    };
  };
  finish?: string;
}

export interface ProjectData {
  id: string;
  worktree: string;
  vcsDir: string;
  vcs: string;
  time: {
    created: number;
    updated: number;
    initialized?: number;
  };
}

export interface ModelStats {
  name: string;
  count: number;
  percentage: number;
}

export interface ProviderStats {
  name: string;
  count: number;
  percentage: number;
}

export interface OpenCodeStats {
  year: number;

  // Time-based
  firstSessionDate: Date;
  daysSinceFirstSession: number;

  // Counts
  totalSessions: number;
  totalMessages: number;
  totalProjects: number;

  // Tokens
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;

  // Cost (only from OpenCode/Zen provider)
  totalCost: number;
  hasZenUsage: boolean;

  // Models (sorted by usage)
  topModels: ModelStats[];

  // Providers (sorted by usage)
  topProviders: ProviderStats[];

  // Streak
  maxStreak: number;
  currentStreak: number;
  maxStreakDays: Set<string>; // Days that form the max streak (for heatmap highlighting)

  // Activity heatmap (for the year)
  dailyActivity: Map<string, number>; // "2025-01-15" -> count

  // Most active day
  mostActiveDay: {
    date: string;
    count: number;
    formattedDate: string;
  } | null;
}

export interface CliArgs {
  year?: number;
  help?: boolean;
}
