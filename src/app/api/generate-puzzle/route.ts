import { NextRequest, NextResponse } from "next/server";
import { generatePuzzle, type Difficulty } from "@/lib/game/generator";
import { savePuzzle, getPuzzleCountByDifficulty } from "@/lib/game/storage";

/**
 * Manual puzzle generation endpoint
 * Generates and saves a new puzzle for the specified difficulty
 * Useful for testing and manual pool management
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const difficulty = (body.difficulty || "medium") as Difficulty;

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty. Must be easy, medium, or hard." },
        { status: 400 }
      );
    }

    // Generate and save puzzle
    const startTime = Date.now();
    const grid = generatePuzzle({ difficulty });
    await savePuzzle(grid, difficulty);
    const generationTime = Date.now() - startTime;

    // Get updated count
    const count = await getPuzzleCountByDifficulty(difficulty);

    return NextResponse.json({
      success: true,
      difficulty,
      generationTime,
      currentPoolSize: count,
      message: `Generated ${difficulty} puzzle in ${generationTime}ms`,
    });
  } catch (error) {
    console.error("Failed to generate puzzle:", error);
    return NextResponse.json(
      { error: "Failed to generate puzzle" },
      { status: 500 }
    );
  }
}

/**
 * Get current generation status
 */
export async function GET(request: NextRequest) {
  try {
    const [easy, medium, hard] = await Promise.all([
      getPuzzleCountByDifficulty("easy"),
      getPuzzleCountByDifficulty("medium"),
      getPuzzleCountByDifficulty("hard"),
    ]);

    const total = easy + medium + hard;
    const target = 10; // TARGET_COUNT

    return NextResponse.json({
      pools: {
        easy: {
          current: easy,
          target,
          percentage: Math.round((easy / target) * 100),
        },
        medium: {
          current: medium,
          target,
          percentage: Math.round((medium / target) * 100),
        },
        hard: {
          current: hard,
          target,
          percentage: Math.round((hard / target) * 100),
        },
      },
      total,
      totalTarget: target * 3,
      health: total >= 15 ? "healthy" : total >= 9 ? "low" : "critical",
    });
  } catch (error) {
    console.error("Failed to get generation status:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
