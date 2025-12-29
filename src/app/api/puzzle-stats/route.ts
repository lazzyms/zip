import { NextRequest, NextResponse } from "next/server";
import { getPuzzleCountByDifficulty } from "@/lib/game/storage";

// Only allow Node.js runtime (not Edge)
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const [easy, medium, hard] = await Promise.all([
      getPuzzleCountByDifficulty("easy"),
      getPuzzleCountByDifficulty("medium"),
      getPuzzleCountByDifficulty("hard"),
    ]);

    const total = easy + medium + hard;

    return NextResponse.json(
      { easy, medium, hard, total },
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
