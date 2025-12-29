"use server";

import schedule from "node-schedule";
import { savePuzzle, getPuzzleCountByDifficulty } from "@/lib/game/storage";
import { generatePuzzle, type Difficulty } from "@/lib/game/generator";

const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const PUZZLES_PER_DIFFICULTY = 10; // Target pool size
const TARGET_COUNT = PUZZLES_PER_DIFFICULTY;
const MIN_COUNT = 5; // Start generating when pool drops below this

let schedulerStarted = false;
let continuousGenerationInterval: NodeJS.Timeout | null = null;

/**
 * Generate and save new puzzles for a given difficulty
 */
async function generateAndSavePuzzles(
  difficulty: Difficulty,
  count: number = 5
) {
  console.log(`Generating ${count} new ${difficulty} puzzles...`);

  try {
    for (let i = 0; i < count; i++) {
      const grid = generatePuzzle({ difficulty });
      await savePuzzle(grid, difficulty);
      console.log(`✓ Generated ${difficulty} puzzle ${i + 1}/${count}`);
    }
  } catch (error) {
    console.error(`Failed to generate puzzles for ${difficulty}:`, error);
  }
}

/**
 * Continuously generate puzzles to maintain pool health
 * This runs every 10 seconds and generates 1 puzzle if any pool is low
 */
async function continuousGeneration() {
  try {
    // Find which difficulty needs puzzles most
    for (const difficulty of difficulties) {
      const count = await getPuzzleCountByDifficulty(difficulty);

      if (count < MIN_COUNT) {
        // Critical: generate immediately
        const grid = generatePuzzle({ difficulty });
        await savePuzzle(grid, difficulty);
        console.log(
          `⚡ Auto-generated ${difficulty} puzzle (pool: ${
            count + 1
          }/${TARGET_COUNT})`
        );
        return; // Generate one at a time to avoid overload
      } else if (count < TARGET_COUNT) {
        // Low but not critical: still generate to maintain pool
        const grid = generatePuzzle({ difficulty });
        await savePuzzle(grid, difficulty);
        console.log(
          `📦 Generated ${difficulty} puzzle (pool: ${
            count + 1
          }/${TARGET_COUNT})`
        );
        return;
      }
    }
  } catch (error) {
    console.error("Continuous generation error:", error);
  }
}

/**
 * Check and replenish puzzle pools
 */
async function replenishPuzzlePool() {
  console.log("🔄 Checking puzzle pool...");

  for (const difficulty of difficulties) {
    try {
      const count = await getPuzzleCountByDifficulty(difficulty);
      console.log(`${difficulty}: ${count}/${TARGET_COUNT} puzzles`);

      if (count < TARGET_COUNT) {
        const needed = TARGET_COUNT - count;
        console.log(
          `⚠️ Low puzzle pool for ${difficulty}, generating ${needed} puzzles...`
        );
        await generateAndSavePuzzles(difficulty, needed);
      } else {
        console.log(`✓ ${difficulty} pool is healthy`);
      }
    } catch (error) {
      console.error(`Failed to check pool for ${difficulty}:`, error);
    }
  }
  console.log("✅ Puzzle pool check complete");
}

/**
 * Start the puzzle generation scheduler
 * Uses both scheduled checks (every 6 hours) and continuous generation (every 10 seconds)
 */
export function startScheduler() {
  if (schedulerStarted) {
    console.log("Scheduler already running");
    return;
  }

  console.log("🚀 Starting intelligent puzzle scheduler...");

  // Run immediate pool check
  replenishPuzzlePool().catch(console.error);

  // Continuous generation: Check every 10 seconds and generate if needed
  continuousGenerationInterval = setInterval(() => {
    continuousGeneration().catch(console.error);
  }, 10000); // 10 seconds

  // Scheduled full replenishment every 6 hours
  const job = schedule.scheduleJob("0 0 */6 * * *", () => {
    console.log("⏰ Scheduled full pool replenishment running...");
    replenishPuzzlePool().catch(console.error);
  });

  if (!job) {
    console.error("❌ Failed to schedule 6-hour job");
  }

  schedulerStarted = true;
  console.log("✓ Intelligent scheduler started:");
  console.log("  - Continuous generation: Every 10 seconds");
  console.log("  - Full replenishment: Every 6 hours");
}

/**
 * Stop the scheduler (for cleanup)
 */
export function stopScheduler() {
  if (continuousGenerationInterval) {
    clearInterval(continuousGenerationInterval);
    continuousGenerationInterval = null;
  }

  schedule.gracefulShutdown();
  schedulerStarted = false;
  console.log("✓ Scheduler stopped");
}
