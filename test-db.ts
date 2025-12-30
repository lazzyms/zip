import { db } from "./src/lib/db";

async function testConnection() {
  try {
    console.log("Testing database connection...");

    // Test basic query
    const result = await db.select().from("puzzles").limit(1);
    console.log("✅ Database connection successful");
    console.log("Sample query result:", result);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}

testConnection();
