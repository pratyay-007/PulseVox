import { FeedbackResult } from "./feedback";
import { SpeechStats } from "./stats";

export interface HistorySession {
  id: string;
  date: string; // ISO date string
  topicTitle: string;
  durationSec: number;
  transcript: string;
  stats: SpeechStats;
  feedback: FeedbackResult;
}

const HISTORY_STORAGE_KEY = "pulsevox_session_history_v1";
const MAX_HISTORY_ITEMS = 100;

export function getHistorySessions(): HistorySession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessionToHistory(session: HistorySession): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getHistorySessions();
    // Prepend new session and cap at 100 items
    const updated = [session, ...existing.filter((s) => s.id !== session.id)].slice(
      0,
      MAX_HISTORY_ITEMS
    );
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // LocalStorage quota exceeded or disabled in private browsing
  }
}

export function deleteHistorySession(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getHistorySessions();
    const filtered = existing.filter((s) => s.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore error
  }
}

export function clearAllHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore error
  }
}

