import { NextRequest, NextResponse } from "next/server";

import { getRandomPuzzle } from "@/lib/game/storage";

// Only allow Node.js runtime (not Edge)
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Get excluded puzzle IDs from query params
    const searchParams = request.nextUrl.searchParams;
    const excludedIdsParam = searchParams.get("excludedIds");
    const excludedIds = excludedIdsParam
      ? excludedIdsParam.split(",").map((id) => parseInt(id, 10))
      : [];

    const { grid, difficulty, puzzleId } = await getRandomPuzzle(excludedIds);
    // puzzleId is now a hash, not a DB id
    return NextResponse.json(
      { grid, difficulty, puzzleId },
      {
        headers: {
          "Cache-Control": "no-store, must-revalidate", // Always fresh
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch puzzle:", error);
    return NextResponse.json(
      { error: "Failed to generate puzzle" },
      { status: 500 }
    );
  }
}
