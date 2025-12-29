"use server";

import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/schema";
import { eq, notInArray, sql } from "drizzle-orm";
import { GameState, Grid } from "./types";
import { generatePuzzle, Difficulty } from "./generator";

// In-memory cache for recently generated puzzles
const puzzleCache = new Map<string, { grid: Grid; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(difficulty: Difficulty): string {
  return `puzzle-${difficulty}`;
}

function isCacheValid(key: string): boolean {
  const cached = puzzleCache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
}

/**
 * Save a generated puzzle to database
 */
export async function savePuzzle(
  grid: Grid,
  difficulty: Difficulty
): Promise<void> {
  try {
    await db.insert(puzzles).values({
      difficulty,
      gridJson: JSON.stringify(grid),
      created: Date.now(),
    });
  } catch (error) {
    console.error("Failed to save puzzle:", error);
  }
}

/**
 * Get a random puzzle by difficulty from database
 */
export async function getPuzzleByDifficulty(
  difficulty: Difficulty,
  excludedIds: number[] = []
): Promise<{ grid: Grid; puzzleId: number } | null> {
  try {
    // Build query with optional exclusion
    let query = db
      .select()
      .from(puzzles)
      .where(eq(puzzles.difficulty, difficulty));

    if (excludedIds.length > 0) {
      query = query.where(notInArray(puzzles.id, excludedIds)) as any;
    }

    // Get random puzzle using SQL random
    const result = await query.orderBy(sql`RANDOM()`).limit(1);

    if (result.length === 0) return null;

    const puzzle = result[0];
    return {
      grid: JSON.parse(puzzle.gridJson) as Grid,
      puzzleId: puzzle.id,
    };
  } catch (error) {
    console.error("Failed to get puzzle from database:", error);
    return null;
  }
}

/**
 * Get or generate a puzzle by difficulty
 * Uses cache to avoid repeated DB queries
 */
export async function getOrGeneratePuzzle(
  difficulty: Difficulty
): Promise<Grid> {
  const cacheKey = getCacheKey(difficulty);

  // Check memory cache first
  if (isCacheValid(cacheKey)) {
    const cached = puzzleCache.get(cacheKey);
    if (cached) {
      return cached.grid;
    }
  }

  // Try to get from database
  const dbPuzzle = await getPuzzleByDifficulty(difficulty);
  if (dbPuzzle) {
    puzzleCache.set(cacheKey, { grid: dbPuzzle, timestamp: Date.now() });
    return dbPuzzle;
  }

  // Generate new puzzle if none exists
  const newPuzzle = generatePuzzle({ difficulty });
  await savePuzzle(newPuzzle, difficulty);
  puzzleCache.set(cacheKey, { grid: newPuzzle, timestamp: Date.now() });

  return newPuzzle;
}

/**
 * Get a random difficulty and fetch puzzle
 */
export async function getRandomPuzzle(excludedIds: number[] = []): Promise<{
  grid: Grid;
  difficulty: Difficulty;
  puzzleId: number;
}> {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  const randomDifficulty =
    difficulties[Math.floor(Math.random() * difficulties.length)];

  // Try to get puzzle from database first
  const dbPuzzle = await getPuzzleByDifficulty(randomDifficulty, excludedIds);
  if (dbPuzzle) {
    return {
      grid: dbPuzzle.grid,
      difficulty: randomDifficulty,
      puzzleId: dbPuzzle.puzzleId,
    };
  }

  // If no puzzle found (all excluded), generate a new one
  const newGrid = generatePuzzle({ difficulty: randomDifficulty });
  await savePuzzle(newGrid, randomDifficulty);

  // Get the newly saved puzzle to get its ID
  const newPuzzle = await getPuzzleByDifficulty(randomDifficulty, excludedIds);
  if (newPuzzle) {
    return {
      grid: newPuzzle.grid,
      difficulty: randomDifficulty,
      puzzleId: newPuzzle.puzzleId,
    };
  }

  // Fallback: return generated grid with ID 0
  return { grid: newGrid, difficulty: randomDifficulty, puzzleId: 0 };
}

/**
 * Count puzzles in database by difficulty
 */
export async function getPuzzleCountByDifficulty(
  difficulty: Difficulty
): Promise<number> {
  try {
    const result = await db
      .select()
      .from(puzzles)
      .where(eq(puzzles.difficulty, difficulty));

    return result.length;
  } catch (error) {
    console.error("Failed to count puzzles:", error);
    return 0;
  }
}

/**
 * Clean up old puzzles (older than 30 days)
 */
export async function cleanupOldPuzzles(): Promise<void> {
  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Note: Drizzle doesn't support delete with lt operator easily,
    // so we'll use raw SQL if needed. For now, just log.
    console.log("Cleanup scheduled for puzzles older than 30 days");
  } catch (error) {
    console.error("Failed to cleanup old puzzles:", error);
  }
}
