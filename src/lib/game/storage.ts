import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";

import { Grid } from "./types";
import { generatePuzzle, Difficulty } from "./generator";

type StoredPuzzle = {
  id: number;
  difficulty: Difficulty;
  grid: Grid;
  gridHash: string;
  createdAt: number;
};

type PuzzleStore = {
  version: number;
  puzzles: StoredPuzzle[];
};

const STORE_VERSION = 1;
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "puzzles.json");
const DEFAULT_STORE: PuzzleStore = { version: STORE_VERSION, puzzles: [] };

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function writeStore(store: PuzzleStore): Promise<void> {
  await ensureDataDir();
  const payload = JSON.stringify(store, null, 2);
  await fs.writeFile(STORE_PATH, payload, "utf-8");
}

async function readStore(): Promise<PuzzleStore> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as PuzzleStore;

    if (parsed.version !== STORE_VERSION || !Array.isArray(parsed.puzzles)) {
      return DEFAULT_STORE;
    }

    return parsed;
  } catch {
    await writeStore(DEFAULT_STORE);
    return DEFAULT_STORE;
  }
}

function hashGrid(grid: Grid): string {
  return createHash("sha256").update(JSON.stringify(grid)).digest("hex");
}

function puzzleIdFromHash(hash: string, seed: string = ""): number {
  const source = seed ? `${hash}-${seed}` : hash;
  const value = Number.parseInt(source.slice(0, 12), 16);
  return Number.isNaN(value) ? Date.now() : value;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function persistPuzzle(
  store: PuzzleStore,
  grid: Grid,
  difficulty: Difficulty
): Promise<StoredPuzzle> {
  const gridHash = hashGrid(grid);
  const existing = store.puzzles.find((p) => p.gridHash === gridHash);
  if (existing) return existing;

  let id = puzzleIdFromHash(gridHash);
  while (store.puzzles.some((p) => p.id === id)) {
    id = puzzleIdFromHash(gridHash, Math.random().toString(16).slice(2));
  }

  const record: StoredPuzzle = {
    id,
    difficulty,
    grid,
    gridHash,
    createdAt: Date.now(),
  };

  store.puzzles.push(record);
  await writeStore(store);
  return record;
}

export async function ensurePuzzleStore(): Promise<void> {
  await readStore();
}

export async function savePuzzle(
  grid: Grid,
  difficulty: Difficulty
): Promise<number> {
  const store = await readStore();
  const saved = await persistPuzzle(store, grid, difficulty);
  return saved.id;
}

export async function getPuzzleByDifficulty(
  difficulty: Difficulty,
  excludedIds: number[] = []
): Promise<{ grid: Grid; puzzleId: number } | null> {
  const store = await readStore();
  const candidates = store.puzzles.filter(
    (p) => p.difficulty === difficulty && !excludedIds.includes(p.id)
  );

  if (candidates.length > 0) {
    const selected = pickRandom(candidates);
    return { grid: selected.grid, puzzleId: selected.id };
  }

  const grid = generatePuzzle({ difficulty });
  const saved = await persistPuzzle(store, grid, difficulty);
  return { grid: saved.grid, puzzleId: saved.id };
}

export async function getOrGeneratePuzzle(
  difficulty: Difficulty
): Promise<Grid> {
  const result = await getPuzzleByDifficulty(difficulty);
  return result?.grid ?? generatePuzzle({ difficulty });
}

export async function getRandomPuzzle(excludedIds: number[] = []): Promise<{
  grid: Grid;
  difficulty: Difficulty;
  puzzleId: number;
}> {
  const store = await readStore();
  const eligible = store.puzzles.filter((p) => !excludedIds.includes(p.id));

  if (eligible.length > 0) {
    const selected = pickRandom(eligible);
    return {
      grid: selected.grid,
      difficulty: selected.difficulty,
      puzzleId: selected.id,
    };
  }

  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  const difficulty = pickRandom(difficulties);
  const grid = generatePuzzle({ difficulty });
  const saved = await persistPuzzle(store, grid, difficulty);

  return { grid: saved.grid, difficulty, puzzleId: saved.id };
}

export async function getPuzzleCountByDifficulty(
  difficulty: Difficulty
): Promise<number> {
  const store = await readStore();
  return store.puzzles.filter((p) => p.difficulty === difficulty).length;
}

export async function getPuzzleCounts(): Promise<{
  easy: number;
  medium: number;
  hard: number;
  total: number;
}> {
  const store = await readStore();
  const easy = store.puzzles.filter((p) => p.difficulty === "easy").length;
  const medium = store.puzzles.filter((p) => p.difficulty === "medium").length;
  const hard = store.puzzles.filter((p) => p.difficulty === "hard").length;
  return { easy, medium, hard, total: easy + medium + hard };
}

export async function cleanupOldPuzzles(): Promise<void> {
  const store = await readStore();
  // Keep store creation but no cleanup logic yet; placeholder for future policies.
  await writeStore(store);
}
