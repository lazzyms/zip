import { NextRequest, NextResponse } from "next/server";

import { getPuzzleCountByDifficulty } from "@/lib/game/storage";

// Only allow Node.js runtime (not Edge)
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // In DB-less mode, always return 0 for all counts
    return NextResponse.json(
      { easy: 0, medium: 0, hard: 0, total: 0 },
      {
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch puzzle stats:", error);
    return NextResponse.json(
      { error: "Failed to get puzzle stats" },
      { status: 500 }
    );
  }
}
