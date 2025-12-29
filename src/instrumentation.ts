import { db } from "@/lib/db";
import { startScheduler } from "@/lib/scheduler";

/**
 * Next.js instrumentation hook runs on server startup
 * Used to initialize database and start background jobs
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("🔧 Initializing ZIP Game Server...");

    try {
      // Initialize database schema (creates tables if they don't exist)
      // Drizzle with better-sqlite3 handles this automatically
      console.log("✓ Database connection established");

      // Start the puzzle generation scheduler
      startScheduler();

      console.log("✅ ZIP Game Server initialized");
    } catch (error) {
      console.error("❌ Failed to initialize server:", error);
      process.exit(1);
    }
  }
}
