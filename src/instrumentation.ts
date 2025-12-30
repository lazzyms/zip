// Only allow Node.js runtime (not Edge)
export const runtime = "nodejs";

/**
 * Next.js instrumentation hook runs on server startup
 * Used to initialize database and start background jobs
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("🔧 Initializing ZIP Game Server...");

    try {
      const [{ ensurePuzzleStore }, { startScheduler }] = await Promise.all([
        import("@/lib/game/storage"),
        import("@/lib/scheduler"),
      ]);

      await ensurePuzzleStore();
      console.log("✓ Puzzle JSON store ready");

      // Start the puzzle generation scheduler
      startScheduler();

      console.log("✅ ZIP Game Server initialized");
    } catch (error) {
      console.error("❌ Failed to initialize server:", error);
      process.exit(1);
    }
  }
}
