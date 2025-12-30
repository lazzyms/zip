CREATE TABLE "analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" text NOT NULL,
	"difficulty" text NOT NULL,
	"completed" integer NOT NULL,
	"playTimeMs" integer NOT NULL,
	"moveCount" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puzzles" (
	"id" serial PRIMARY KEY NOT NULL,
	"difficulty" text NOT NULL,
	"gridJson" text NOT NULL,
	"gridHash" text NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"completions" integer DEFAULT 0,
	"avgPlayTimeMs" real DEFAULT 0,
	CONSTRAINT "puzzles_gridHash_unique" UNIQUE("gridHash")
);
