// Data collector - reads OpenCode storage and returns raw data

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { SessionData, MessageData, ProjectData } from "./types";

const OPENCODE_DATA_PATH = join(
  process.env.HOME || "~",
  ".local/share/opencode/storage"
);

export async function getOpenCodeDataPath(): Promise<string> {
  return OPENCODE_DATA_PATH;
}

export async function checkOpenCodeDataExists(): Promise<boolean> {
  try {
    await readdir(OPENCODE_DATA_PATH);
    return true;
  } catch {
    return false;
  }
}

export async function collectSessions(year?: number): Promise<SessionData[]> {
  const sessionsPath = join(OPENCODE_DATA_PATH, "session");
  const sessions: SessionData[] = [];

  try {
    // Get all project directories in session folder
    const projectDirs = await readdir(sessionsPath);

    for (const projectDir of projectDirs) {
      const projectPath = join(sessionsPath, projectDir);

      try {
        const sessionFiles = await readdir(projectPath);

        for (const sessionFile of sessionFiles) {
          if (!sessionFile.endsWith(".json")) continue;

          try {
            const filePath = join(projectPath, sessionFile);
            const content = await Bun.file(filePath).json();
            const session = content as SessionData;

            // Filter by year if specified
            if (year) {
              const sessionDate = new Date(session.time.created);
              if (sessionDate.getFullYear() !== year) continue;
            }

            sessions.push(session);
          } catch {
            // Skip invalid JSON files
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    }
  } catch (error) {
    throw new Error(`Failed to read sessions: ${error}`);
  }

  return sessions;
}

export async function collectMessages(year?: number): Promise<MessageData[]> {
  const messagesPath = join(OPENCODE_DATA_PATH, "message");
  const messages: MessageData[] = [];

  try {
    // Get all session directories in message folder
    const sessionDirs = await readdir(messagesPath);

    for (const sessionDir of sessionDirs) {
      const sessionPath = join(messagesPath, sessionDir);

      try {
        const messageFiles = await readdir(sessionPath);

        for (const messageFile of messageFiles) {
          if (!messageFile.endsWith(".json")) continue;

          try {
            const filePath = join(sessionPath, messageFile);
            const content = await Bun.file(filePath).json();
            const message = content as MessageData;

            // Filter by year if specified
            if (year) {
              const messageDate = new Date(message.time.created);
              if (messageDate.getFullYear() !== year) continue;
            }

            messages.push(message);
          } catch {
            // Skip invalid JSON files
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    }
  } catch (error) {
    throw new Error(`Failed to read messages: ${error}`);
  }

  return messages;
}

export async function collectAllSessions(): Promise<SessionData[]> {
  return collectSessions();
}

export async function collectAllMessages(): Promise<MessageData[]> {
  return collectMessages();
}

export async function collectProjects(): Promise<ProjectData[]> {
  const projectsPath = join(OPENCODE_DATA_PATH, "project");
  const projects: ProjectData[] = [];

  try {
    const projectFiles = await readdir(projectsPath);

    for (const projectFile of projectFiles) {
      if (!projectFile.endsWith(".json")) continue;

      try {
        const filePath = join(projectsPath, projectFile);
        const content = await Bun.file(filePath).json();
        const project = content as ProjectData;
        projects.push(project);
      } catch {
        // Skip invalid JSON files
      }
    }
  } catch {
    // Projects directory might not exist
  }

  return projects;
}
