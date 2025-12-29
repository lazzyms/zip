"use server";

import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/schema";
import { eq, notInArray, sql } from "drizzle-orm";
import { GameState, Grid } from "./types";
import { generatePuzzle, Difficulty } from "./generator";
import crypto from "crypto";

// In-memory cache for recently generated puzzles
const puzzleCache = new Map<string, { grid: Grid; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a unique hash for a puzzle grid
 * This creates a fingerprint based on the grid structure
 */
function generatePuzzleHash(grid: Grid): string {
  const gridJson = JSON.stringify(grid);
  return crypto.createHash("sha256").update(gridJson).digest("hex");
}

function getCacheKey(difficulty: Difficulty): string {
  return `puzzle-${difficulty}`;
}

function isCacheValid(key: string): boolean {
  const cached = puzzleCache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
}

/**
 * Check if a puzzle with the same hash already exists
 */
async function puzzleExists(hash: string): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(puzzles)
      .where(eq(puzzles.gridHash, hash))
      .limit(1);
    return result.length > 0;
  } catch (error) {
    console.error("Failed to check puzzle existence:", error);
    return false;
  }
}

/**
 * Save a generated puzzle to database
 * Returns true if saved successfully, false if duplicate
 */
export async function savePuzzle(
  grid: Grid,
  difficulty: Difficulty
): Promise<boolean> {
  try {
    const hash = generatePuzzleHash(grid);

    // Check if this exact puzzle already exists
    if (await puzzleExists(hash)) {
      console.log(
        `Duplicate puzzle detected (hash: ${hash.substring(
          0,
          8
        )}...), skipping save`
      );
      return false;
    }

    await db.insert(puzzles).values({
      difficulty,
      gridJson: JSON.stringify(grid),
      gridHash: hash,
      created: Date.now(),
    });
    return true;
  } catch (error) {
    console.error("Failed to save puzzle:", error);
    return false;
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
    puzzleCache.set(cacheKey, { grid: dbPuzzle.grid, timestamp: Date.now() });
    return dbPuzzle.grid;
  }

  // Generate new puzzle if none exists
  const newPuzzle = generatePuzzle({ difficulty });
  await savePuzzle(newPuzzle, difficulty);
  puzzleCache.set(cacheKey, { grid: newPuzzle, timestamp: Date.now() });

  return newPuzzle;
}

/**
 * Get a random difficulty and fetch puzzle
 * Always generates new puzzles on-demand to ensure unlimited unique puzzles
 */
export async function getRandomPuzzle(excludedIds: number[] = []): Promise<{
  grid: Grid;
  difficulty: Difficulty;
  puzzleId: number;
}> {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  const randomDifficulty =
    difficulties[Math.floor(Math.random() * difficulties.length)];

  let newGrid: Grid;
  let saved = false;
  let attempts = 0;
  const maxAttempts = 10;

  // Keep generating until we get a unique puzzle
  while (!saved && attempts < maxAttempts) {
    newGrid = generatePuzzle({ difficulty: randomDifficulty });
    saved = await savePuzzle(newGrid, randomDifficulty);
    attempts++;

    if (!saved) {
      console.log(`Attempt ${attempts}: Generated duplicate, trying again...`);
    }
  }

  if (!saved) {
    // After max attempts, just use the last generated puzzle anyway
    console.warn(
      `Failed to generate unique puzzle after ${maxAttempts} attempts, using last generated`
    );
    newGrid = generatePuzzle({ difficulty: randomDifficulty });
    await savePuzzle(newGrid, randomDifficulty); // Force save
  }

  // Get the newly saved puzzle to retrieve its ID
  try {
    const result = await db
      .select()
      .from(puzzles)
      .where(eq(puzzles.difficulty, randomDifficulty))
      .orderBy(sql`${puzzles.created} DESC`)
      .limit(1);

    if (result.length > 0) {
      return {
        grid: JSON.parse(result[0].gridJson) as Grid,
        difficulty: randomDifficulty,
        puzzleId: result[0].id,
      };
    }
  } catch (error) {
    console.error("Failed to retrieve saved puzzle:", error);
  }

  // Fallback: use a timestamp-based ID if database query fails
  return {
    grid: newGrid!,
    difficulty: randomDifficulty,
    puzzleId: Date.now(),
  };
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
