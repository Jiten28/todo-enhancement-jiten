import type { EmojiStyle } from "emoji-picker-react";

/**
 * Represents a universally unique identifier.
 */
export type UUID = ReturnType<typeof crypto.randomUUID>;

export type DarkModeOptions = "system" | "auto" | "light" | "dark";

/**
 * Task priority levels
 */
export type Priority = "low" | "medium" | "high" | "critical";

export interface PriorityConfig {
  id: Priority; // e.g. "critical", "high", "medium", "low"
  label: string; // user-friendly label
  color: string; // HEX color or theme color
}

/**
 * Represents a user in the application.
 */
export interface User {
  name: string | null;
  createdAt: Date;
  profilePicture: string | null; // must be URL or LOCAL_FILE_UUID
  emojisStyle: EmojiStyle;
  tasks: Task[];
  deletedTasks: UUID[];
  categories: Category[];
  deletedCategories: UUID[];
  favoriteCategories: UUID[];
  colorList: string[];
  settings: AppSettings;
  theme: "system" | (string & {});
  darkmode: DarkModeOptions;
  lastSyncedAt?: Date;

  /** ✅ single source of truth for priorities */
  priorityList: PriorityConfig[];
}

/**
 * Represents a task in the application.
 */
export interface Task {
  id: UUID;
  done: boolean;
  pinned: boolean;
  name: string;
  description?: string;
  emoji?: string;
  color: string;

  /** created at date */
  date: Date;
  deadline?: Date;
  category?: Category[];
  lastSave?: Date;
  sharedBy?: string;

  /** Optional numeric position for drag-and-drop (for p2p sync) */
  position?: number;

  /** ✅ Always required priority */
  priority: Priority;
}

/**
 * Represents a category in the application.
 */
export interface Category {
  id: UUID;
  name: string;
  emoji?: string;
  color: string;
  lastSave?: Date;
}

/**
 * Represents application settings for the user.
 */
export interface AppSettings {
  enableCategories: boolean;
  doneToBottom: boolean;
  enableGlow: boolean;
  simpleEmojiPicker: boolean;
  enableReadAloud: boolean;
  appBadge: boolean;
  showProgressBar: boolean;
  voice: `${string}::${string}`;
  voiceVolume: number;
  sortOption: SortOption;
  reduceMotion: ReduceMotionOption;
}

export type SortOption = "dateCreated" | "dueDate" | "alphabetical" | "custom" | "priority";

export type ReduceMotionOption = "system" | "on" | "off";
