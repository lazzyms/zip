#!/usr/bin/env tsx
/**
 * Continuous Puzzle Generation Script
 *
 * Generates puzzles every second for testing/demonstration purposes.
 * This script runs independently and continuously generates puzzles
 * until manually stopped (Ctrl+C).
 *
 * Usage:
 *   npm run generate-puzzles
 *   or
 *   npx tsx scripts/generate-puzzles-continuous.ts
 */

import { generatePuzzle, type Difficulty } from "../src/lib/game/generator";
import {
  savePuzzle,
  getPuzzleCountByDifficulty,
} from "../src/lib/game/storage";

const difficulties: Difficulty[] = ["easy", "medium", "hard"];
let totalGenerated = 0;
let isRunning = true;

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

    // Get current counts
    const count = await getPuzzleCountByDifficulty(difficulty);

    console.log(
      `✓ [${new Date().toLocaleTimeString()}] Generated ${difficulty.padEnd(
        6
      )} puzzle #${totalGenerated} (${duration}ms) - Pool: ${count}`
    );
    console.log(
      `   📊 Total: ${totalGenerated} | Easy: ${stats.easy} | Medium: ${stats.medium} | Hard: ${stats.hard}`
    );
  } catch (error) {
    console.error(`❌ Failed to generate ${difficulty} puzzle:`, error);
  }
}

/**
 * Display current puzzle pool status
 */
async function displayPoolStatus() {
  console.log("\n📊 Current Puzzle Pool Status:");
  for (const difficulty of difficulties) {
    const count = await getPuzzleCountByDifficulty(difficulty);
    console.log(`   ${difficulty.padEnd(6)}: ${count} puzzles`);
  }
  console.log("");
}

/**
 * Main execution loop
 */
async function main() {
  console.log("🚀 Starting Continuous Puzzle Generation");
  console.log("   Generating one puzzle every second...");
  console.log("   Press Ctrl+C to stop\n");

  // Display initial pool status
  await displayPoolStatus();

  // Set up interval to generate puzzles every second
  const interval = setInterval(async () => {
    if (isRunning) {
      await generateAndSaveSinglePuzzle();
    }
  }, 1000); // 1 second interval

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\n⏹️  Stopping puzzle generation...");
    isRunning = false;
    clearInterval(interval);

    // Display final stats
    await displayPoolStatus();
    console.log("✅ Final Stats:");
    console.log(`   Total Generated: ${totalGenerated}`);
    console.log(`   Easy: ${stats.easy}`);
    console.log(`   Medium: ${stats.medium}`);
    console.log(`   Hard: ${stats.hard}`);
    console.log("\n👋 Goodbye!\n");

    process.exit(0);
  });
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
