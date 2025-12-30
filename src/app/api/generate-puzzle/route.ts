import { NextRequest, NextResponse } from "next/server";
import { generatePuzzle, type Difficulty } from "@/lib/game/generator";
import { savePuzzle } from "@/lib/game/storage";

// Only allow Node.js runtime (not Edge)
export const runtime = "nodejs";

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

    // Generate and "save" puzzle (no-op in DB-less mode)
    const startTime = Date.now();
    const grid = generatePuzzle({ difficulty });
    const puzzleId = await savePuzzle(grid, difficulty);
    const generationTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      difficulty,
      puzzleId,
      generationTime,
      message: `Generated ${difficulty} puzzle in ${generationTime}ms (stored in JSON)`,
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
export async function GET() {
  // In DB-less mode, always return 0 for all counts
  const easy = 0,
    medium = 0,
    hard = 0,
    total = 0,
    target = 10;
  return NextResponse.json({
    pools: {
      easy: { current: easy, target, percentage: 0 },
      medium: { current: medium, target, percentage: 0 },
      hard: { current: hard, target, percentage: 0 },
    },
    total,
    totalTarget: target * 3,
    health: "critical",
  });
}
