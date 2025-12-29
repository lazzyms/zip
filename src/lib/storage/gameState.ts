import { GameState, Position } from "@/lib/game/types";

export interface SavedGameState {
  gridJson: string;
  path: Position[];
  status: "playing" | "won" | "lost";
  difficulty: "easy" | "medium" | "hard";
  startTime: number;
  lastSavedTime: number;
  puzzleId?: number;
}

const STORAGE_KEY = "zip_game_state";
const SESSION_KEY = "zip_session_id";
const HIGH_SCORE_KEY = "zip_session_high_score";
const SOLVED_PUZZLES_KEY = "zip_solved_puzzles";

/**
 * Save current game state to localStorage
 */
export function saveGameState(
  gameState: GameState & {
    startTime?: number;
    difficulty?: "easy" | "medium" | "hard";
    puzzleId?: number;
  },
  difficulty: "easy" | "medium" | "hard",
  gridJson: string
): void {
  if (typeof window === "undefined") return; // Server-side guard

  try {
    const saved: SavedGameState = {
      gridJson,
      path: gameState.path,
      status: gameState.status,
      difficulty,
      startTime:
        gameState.startTime ||
        parseInt(sessionStorage.getItem(SESSION_KEY) || String(Date.now())),
      lastSavedTime: Date.now(),
      puzzleId: gameState.puzzleId,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch (error) {
    console.error("Failed to save game state:", error);
  }
}

/**
 * Load game state from localStorage
 */
export function loadGameState(): SavedGameState | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as SavedGameState;

    // Only restore if saved less than 7 days ago
    const dayInMs = 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.lastSavedTime > 7 * dayInMs) {
      clearGameState();
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load game state:", error);
    return null;
  }
}

/**
 * Clear saved game state
 */
export function clearGameState(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear game state:", error);
  }
}

/**
 * Get or create session ID (tracks play session duration)
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Get play time for current session in milliseconds
 */
export function getPlayTimeMs(startTime: number): number {
  return Date.now() - startTime;
}

/**
 * Format play time for display
 */
export function formatPlayTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Get session high score (best time)
 * Returns time in milliseconds or null if no high score
 */
export function getSessionHighScore(): number | null {
  if (typeof window === "undefined") return null;

  try {
    const score = sessionStorage.getItem(HIGH_SCORE_KEY);
    return score ? parseInt(score, 10) : null;
  } catch (error) {
    console.error("Failed to get high score:", error);
    return null;
  }
}

/**
 * Update session high score if new time is better (lower)
 * Returns true if a new record was set
 */
export function updateSessionHighScore(timeMs: number): boolean {
  if (typeof window === "undefined") return false;

  try {
    const currentHighScore = getSessionHighScore();

    // If no high score or new time is better (lower), update it
    if (currentHighScore === null || timeMs < currentHighScore) {
      sessionStorage.setItem(HIGH_SCORE_KEY, timeMs.toString());
      return true; // New record!
    }

    return false; // Not a new record
  } catch (error) {
    console.error("Failed to update high score:", error);
    return false;
  }
}

/**
 * Clear session high score (useful for testing or reset)
 */
export function clearSessionHighScore(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(HIGH_SCORE_KEY);
  } catch (error) {
    console.error("Failed to clear high score:", error);
  }
}

/**
 * Get list of solved puzzle IDs
 */
export function getSolvedPuzzleIds(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const solved = localStorage.getItem(SOLVED_PUZZLES_KEY);
    return solved ? JSON.parse(solved) : [];
  } catch (error) {
    console.error("Failed to get solved puzzles:", error);
    return [];
  }
}

/**
 * Add a puzzle ID to the solved list
 */
export function markPuzzleAsSolved(puzzleId: number): void {
  if (typeof window === "undefined") return;

  try {
    const solved = getSolvedPuzzleIds();
    if (!solved.includes(puzzleId)) {
      solved.push(puzzleId);
      localStorage.setItem(SOLVED_PUZZLES_KEY, JSON.stringify(solved));
    }
  } catch (error) {
    console.error("Failed to mark puzzle as solved:", error);
  }
}

/**
 * Clear solved puzzles list (useful for reset)
 */
export function clearSolvedPuzzles(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SOLVED_PUZZLES_KEY);
  } catch (error) {
    console.error("Failed to clear solved puzzles:", error);
  }
}
