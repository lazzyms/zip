import { GameState, Grid } from "./types";
import { generatePuzzle, Difficulty } from "./generator";

// In-memory cache for recently generated puzzles (per difficulty)
const puzzleCache = new Map<string, { grid: Grid; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Simple hash function for fallback puzzleId (not cryptographically secure)
function simpleHash(str: string): number {
  let hash = 0,
    i,
    chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getCacheKey(difficulty: Difficulty): string {
  return `puzzle-${difficulty}`;
}

function isCacheValid(key: string): boolean {
  const cached = puzzleCache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
}

// No-op for savePuzzle in DB-less mode (always returns true)
export async function savePuzzle(
  grid: Grid,
  difficulty: Difficulty
): Promise<boolean> {
  return true;
}

// In DB-less mode, just generate a new puzzle on demand
export async function getPuzzleByDifficulty(
  difficulty: Difficulty,
  excludedIds: number[] = []
): Promise<{ grid: Grid; puzzleId: number } | null> {
  const grid = generatePuzzle({ difficulty });
  const gridJson = JSON.stringify(grid);
  const puzzleId = simpleHash(gridJson + Date.now());
  return { grid, puzzleId };
}

// Get or generate a puzzle by difficulty (cache for short period)
export async function getOrGeneratePuzzle(
  difficulty: Difficulty
): Promise<Grid> {
  const cacheKey = getCacheKey(difficulty);
  if (isCacheValid(cacheKey)) {
    const cached = puzzleCache.get(cacheKey);
    if (cached) return cached.grid;
  }
  const newPuzzle = generatePuzzle({ difficulty });
  puzzleCache.set(cacheKey, { grid: newPuzzle, timestamp: Date.now() });
  return newPuzzle;
}

// Always generate a new puzzle on demand (no DB, no deduplication)
export async function getRandomPuzzle(excludedIds: number[] = []): Promise<{
  grid: Grid;
  difficulty: Difficulty;
  puzzleId: number;
}> {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  const randomDifficulty =
    difficulties[Math.floor(Math.random() * difficulties.length)];
  const grid = generatePuzzle({ difficulty: randomDifficulty });
  const gridJson = JSON.stringify(grid);
  const puzzleId = simpleHash(gridJson + Date.now());
  return { grid, difficulty: randomDifficulty, puzzleId };
}

// In DB-less mode, just return 0 (no persistent pool)
export async function getPuzzleCountByDifficulty(
  difficulty: Difficulty
): Promise<number> {
  return 0;
}

// No-op in DB-less mode
export async function cleanupOldPuzzles(): Promise<void> {
  return;
}
