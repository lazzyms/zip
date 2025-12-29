import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

// Only allow Node.js runtime (not Edge)
export const runtime = "nodejs";

// Only initialize on server side
let dbInstance: ReturnType<typeof drizzle> | null = null;

function initDb() {
  if (dbInstance) return dbInstance;

  if (typeof window !== "undefined") {
    throw new Error("Database should only be initialized on the server");
  }

  const dataDir = ".data";

  // Ensure .data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlite = new Database(path.join(dataDir, "zip.db"));
  sqlite.pragma("journal_mode = WAL");

  dbInstance = drizzle(sqlite, { schema });
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
