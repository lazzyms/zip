import { NextRequest, NextResponse } from "next/server";

// Only allow Node.js runtime (not Edge)
export const runtime = "nodejs";

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

    // Log-only: print analytics event to console (no DB)
    console.log("Analytics event:", {
      sessionId,
      difficulty,
      completed,
      playTimeMs,
      moveCount,
    });

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
export async function GET() {
  try {
    // No analytics summary in DB-less mode
    return NextResponse.json({
      message: "Analytics summary not available in DB-less mode.",
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
