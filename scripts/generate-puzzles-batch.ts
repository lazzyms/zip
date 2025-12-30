#!/usr/bin/env tsx
/**
 * Batch Puzzle Generation Script
 *
 * Generates 99999 puzzles in one shot for bulk testing or population.
 * Clears existing puzzles at the start, then generates and saves all puzzles,
 * logging progress every 1000 puzzles.
 *
 * Usage:
 *   npx tsx scripts/generate-puzzles-batch.ts
 */

import { generatePuzzle, type Difficulty } from "../src/lib/game/generator";
import {
  savePuzzle,
  getPuzzleCountByDifficulty,
  clearPuzzles,
} from "../src/lib/game/storage";

const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const TOTAL_TO_GENERATE = 99999;
let totalGenerated = 0;

// Stats tracking
const stats = {
  easy: 0,
  medium: 0,
  hard: 0,
};

/**
 * Generate a single puzzle and save it to the database
 */
async function generateAndSaveSinglePuzzle() {
  // Rotate through difficulties
  const difficulty = difficulties[totalGenerated % difficulties.length];

  try {
    const startTime = Date.now();
    const grid = generatePuzzle({ difficulty });
    await savePuzzle(grid, difficulty);
    const duration = Date.now() - startTime;

    stats[difficulty]++;
    totalGenerated++;

    // Log every 1000 puzzles
    if (totalGenerated % 1000 === 0) {
      console.log(
        `✓ [${new Date().toLocaleTimeString()}] Generated ${totalGenerated}/${TOTAL_TO_GENERATE} puzzles (${duration}ms per puzzle)`
      );
      console.log(
        `   📊 Progress: Easy: ${stats.easy} | Medium: ${stats.medium} | Hard: ${stats.hard}`
      );
    }
  } catch (error) {
    console.error(`❌ Failed to generate ${difficulty} puzzle:`, error);
  }
}

/**
 * Display final puzzle pool status
 */
async function displayFinalStats() {
  console.log("\n📊 Final Puzzle Pool Status:");
  for (const difficulty of difficulties) {
    const count = await getPuzzleCountByDifficulty(difficulty);
    console.log(`   ${difficulty.padEnd(6)}: ${count} puzzles`);
  }
  console.log("");
  console.log("✅ Final Stats:");
  console.log(`   Total Generated: ${totalGenerated}`);
  console.log(`   Easy: ${stats.easy}`);
  console.log(`   Medium: ${stats.medium}`);
  console.log(`   Hard: ${stats.hard}`);
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting Batch Puzzle Generation");
  console.log(`   Generating ${TOTAL_TO_GENERATE} puzzles...`);
  console.log("   Clearing existing puzzles first...\n");

  // Clear existing puzzles
  await clearPuzzles();

  const startTime = Date.now();

  // Generate puzzles in a loop
  for (let i = 0; i < TOTAL_TO_GENERATE; i++) {
    await generateAndSaveSinglePuzzle();
  }

  const totalDuration = Date.now() - startTime;
  console.log(
    `\n🎉 Generation complete in ${totalDuration}ms (${(
      totalDuration / TOTAL_TO_GENERATE
    ).toFixed(2)}ms per puzzle)`
  );

  // Display final stats
  await displayFinalStats();
  console.log("\n👋 Batch generation finished!\n");
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
