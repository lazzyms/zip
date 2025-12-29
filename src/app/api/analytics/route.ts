import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analytics, puzzles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, difficulty, completed, playTimeMs, moveCount } = body;

    if (!sessionId || !difficulty) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save analytics event
    await db.insert(analytics).values({
      sessionId,
      difficulty,
      completed: completed ? 1 : 0,
      playTimeMs,
      moveCount,
      timestamp: Date.now(),
    });

    // If completed, update puzzle stats
    if (completed) {
      // Get existing puzzle with this difficulty to update stats
      const existingPuzzles = await db
        .select()
        .from(puzzles)
        .where(eq(puzzles.difficulty, difficulty))
        .limit(1);

      if (existingPuzzles.length > 0) {
        const puzzle = existingPuzzles[0];
        const newCompletions = (puzzle.completions || 0) + 1;
        const currentAvgMs = puzzle.avgPlayTimeMs || 0;

        // Calculate new average
        const newAvgMs =
          (currentAvgMs * (newCompletions - 1) + playTimeMs) / newCompletions;

        // Update puzzle completion stats
        await db
          .update(puzzles)
          .set({
            completions: newCompletions,
            avgPlayTimeMs: newAvgMs,
          })
          .where(eq(puzzles.id, puzzle.id));
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to log analytics:", error);
    return NextResponse.json(
      { error: "Failed to log analytics" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics
 * Returns analytics summary for dashboard (admin only in production)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const difficulty = searchParams.get("difficulty");

    if (!difficulty) {
      return NextResponse.json(
        { error: "Difficulty parameter required" },
        { status: 400 }
      );
    }

    const analyticsData = await db
      .select()
      .from(analytics)
      .where(eq(analytics.difficulty, difficulty));

    const completed = analyticsData.filter(
      (a: (typeof analyticsData)[0]) => a.completed === 1
    ).length;
    const total = analyticsData.length;
    const avgPlayTime =
      total > 0
        ? analyticsData.reduce(
            (sum: number, a: (typeof analyticsData)[0]) => sum + a.playTimeMs,
            0
          ) / total
        : 0;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return NextResponse.json({
      difficulty,
      total,
      completed,
      completionRate: Math.round(completionRate),
      avgPlayTimeMs: Math.round(avgPlayTime),
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
