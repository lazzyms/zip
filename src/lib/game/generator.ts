import { Grid, Cell, Position, Direction } from "./types";

export type Difficulty = "easy" | "medium" | "hard";

interface GeneratorOptions {
  difficulty?: Difficulty;
}

function getDimensionsForDifficulty(difficulty: Difficulty): {
  rows: number;
  cols: number;
} {
  const size = Math.floor(Math.random() * 5) + 3; // 3 to 7
  return { rows: size, cols: size };
}

function getCheckpointRange(rows: number): { min: number; max: number } {
  if (rows === 3) return { min: 3, max: 5 };
  if (rows === 4) return { min: 4, max: 7 };
  if (rows === 5) return { min: 5, max: 9 };
  if (rows === 6) return { min: 6, max: 12 };
  if (rows === 7) return { min: 8, max: 18 };
  return { min: 5, max: 12 }; // fallback
}

function getCheckpointDensityForDifficulty(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy":
      return 0.6; // 60% of cells have checkpoints
    case "medium":
      return 0.4; // 40% of cells have checkpoints
    case "hard":
      return 0.15; // 15% of cells have checkpoints
    default:
      return 0.4;
  }
}

// Helper to get orthogonal neighbors
function getNeighbors(
  row: number,
  col: number,
  rows: number,
  cols: number
): { dir: Direction; pos: Position }[] {
  const neighbors: { dir: Direction; pos: Position }[] = [];
  if (row > 0) neighbors.push({ dir: "N", pos: { row: row - 1, col } });
  if (row < rows - 1) neighbors.push({ dir: "S", pos: { row: row + 1, col } });
  if (col > 0) neighbors.push({ dir: "W", pos: { row, col: col - 1 } });
  if (col < cols - 1) neighbors.push({ dir: "E", pos: { row, col: col + 1 } });
  return neighbors;
}

function getOppositeDir(dir: Direction): Direction {
  switch (dir) {
    case "N":
      return "S";
    case "S":
      return "N";
    case "E":
      return "W";
    case "W":
      return "E";
  }
}

// Initialize an empty grid with all walls present or absent?
// Strategy: Initialize with NO walls, then generate path, then set walls.
function createEmptyGrid(rows: number, cols: number): Grid {
  const grid: Grid = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        num: 0,
        walls: { N: false, S: false, E: false, W: false }, // Initially open, will close later
      });
    }
    grid.push(row);
  }
  return grid;
}

// Generate a random Hamiltonian path
function generateHamiltonianPath(
  rows: number,
  cols: number
): Position[] | null {
  const totalCells = rows * cols;
  const visited = new Set<string>();
  const path: Position[] = [];

  // Start at random position? Or fixed? Random is better for variety.
  // Actually, usually fixed start/end in corners is easier for players?
  // Let's randomize start.
  const startRow = Math.floor(Math.random() * rows);
  const startCol = Math.floor(Math.random() * cols);

  // DFS helper
  function backtrack(curr: Position): boolean {
    path.push(curr);
    visited.add(`${curr.row},${curr.col}`);

    if (path.length === totalCells) {
      return true;
    }

    const neighbors = getNeighbors(curr.row, curr.col, rows, cols);
    // Shuffle neighbors for randomness
    for (let i = neighbors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
    }

    for (const { pos } of neighbors) {
      if (!visited.has(`${pos.row},${pos.col}`)) {
        if (backtrack(pos)) return true;
      }
    }

    // Backtrack
    visited.delete(`${curr.row},${curr.col}`);
    path.pop();
    return false;
  }

  if (backtrack({ row: startRow, col: startCol })) {
    return path;
  }
  return null;
}

export function generatePuzzle(options?: GeneratorOptions): Grid {
  const difficulty = options?.difficulty || "medium";
  const { rows, cols } = getDimensionsForDifficulty(difficulty);

  let path: Position[] | null = null;
  let attempts = 0;
  const maxAttempts = 100;

  while (!path && attempts < maxAttempts) {
    path = generateHamiltonianPath(rows, cols);
    attempts++;
  }

  if (!path) {
    throw new Error("Failed to generate Hamiltonian path after max attempts");
  }

  const grid = createEmptyGrid(rows, cols);

  // Initialize all walls to TRUE (blocked)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].walls = { N: true, S: true, E: true, W: true };
    }
  }

  // Open walls along the path
  for (let i = 0; i < path.length - 1; i++) {
    const curr = path[i];
    const next = path[i + 1];

    // Determine direction
    let dir: Direction | null = null;
    if (next.row < curr.row) dir = "N";
    else if (next.row > curr.row) dir = "S";
    else if (next.col < curr.col) dir = "W";
    else if (next.col > curr.col) dir = "E";

    if (dir) {
      grid[curr.row][curr.col].walls[dir] = false;
      grid[next.row][next.col].walls[getOppositeDir(dir)] = false;
    }
  }

  // Place checkpoints sequentially along path
  grid[path[0].row][path[0].col].num = 1;

  const { min, max } = getCheckpointRange(rows);
  const numCheckpoints = Math.floor(Math.random() * (max - min + 1)) + min; // min to max

  const potentialIndices: number[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    potentialIndices.push(i);
  }

  // Shuffle
  for (let i = potentialIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [potentialIndices[i], potentialIndices[j]] = [
      potentialIndices[j],
      potentialIndices[i],
    ];
  }

  // Select top N
  const selectedIndices = potentialIndices.slice(0, numCheckpoints - 2);

  // Add End index
  selectedIndices.push(path.length - 1);

  // Sort indices to ensure sequential numbering matches path order
  selectedIndices.sort((a, b) => a - b);

  // Assign numbers 2, 3, 4...
  selectedIndices.forEach((pathIdx, i) => {
    const pos = path[pathIdx];
    grid[pos.row][pos.col].num = i + 2;
  });

  return grid;
}
