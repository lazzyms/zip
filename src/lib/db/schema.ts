import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const puzzles = sqliteTable("puzzles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  difficulty: text("difficulty").notNull(), // 'easy' | 'medium' | 'hard'
  gridJson: text("gridJson").notNull(), // JSON stringified Cell[][]
  gridHash: text("gridHash").notNull().unique(), // SHA256 hash for uniqueness
  created: integer("created").notNull(), // timestamp
  completions: integer("completions").default(0), // times successfully completed
  avgPlayTimeMs: real("avgPlayTimeMs").default(0), // average play time in milliseconds
});

export const analytics = sqliteTable("analytics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("sessionId").notNull(), // unique session identifier
  difficulty: text("difficulty").notNull(), // 'easy' | 'medium' | 'hard'
  completed: integer("completed").notNull(), // 1 = completed, 0 = abandoned
  playTimeMs: integer("playTimeMs").notNull(), // total time in milliseconds
  moveCount: integer("moveCount").notNull(), // number of moves made
  timestamp: integer("timestamp").notNull(), // when the session ended
});
