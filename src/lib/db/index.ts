import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

// Only allow Node.js runtime (not Edge)
export const runtime = "nodejs";

// Only initialize on server side
let dbInstance: ReturnType<typeof drizzle> | null = null;

function initDb(): ReturnType<typeof drizzle> {
  if (dbInstance) return dbInstance;

  if (typeof window !== "undefined") {
    throw new Error("Database should only be initialized on the server");
  }

  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}

export function getDb(): ReturnType<typeof drizzle> {
  return initDb();
}

export const db: ReturnType<typeof drizzle> = getDb();
