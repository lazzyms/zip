import { NextResponse } from "next/server";

import { getPuzzleCounts } from "@/lib/game/storage";

// Only allow Node.js runtime (not Edge)
export const runtime = "nodejs";

export async function GET() {
  try {
    const counts = await getPuzzleCounts();
    return NextResponse.json(counts, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to fetch puzzle stats:", error);
    return NextResponse.json(
      { error: "Failed to get puzzle stats" },
      { status: 500 }
    );
  }
}
