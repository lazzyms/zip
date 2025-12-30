import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";
// Only allow Node.js runtime (not Edge)
export const runtime = "nodejs";

// Only initialize on server side
let dbInstance: ReturnType<typeof drizzle> | null = null;

function initDb() {
  if (dbInstance) return dbInstance;

  if (typeof window !== "undefined") {
    throw new Error("Database should only be initialized on the server");
  }

  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}

export function getDb() {
  return initDb();
}

export const db = {
  get select() {
    return getDb().select.bind(getDb());
  },
  get insert() {
    return getDb().insert.bind(getDb());
  },
  get update() {
    return getDb().update.bind(getDb());
  },
  get delete() {
    return getDb().delete.bind(getDb());
  },
  get query() {
    return getDb().query;
  },
} as any;
