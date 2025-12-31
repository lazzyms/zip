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
  if (rows === 3) return { min: 4, max: 5 };
  if (rows === 4) return { min: 6, max: 7 };
  if (rows === 5) return { min: 10, max: 12 };
  if (rows === 6) return { min: 15, max: 18 };
  if (rows === 7) return { min: 20, max: 25 };
  return { min: 10, max: 15 }; // fallback
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

// Check if there's exactly one Hamiltonian path from start to end
function isSinglePath(grid: Grid): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  let start: Position | null = null;
  let end: Position | null = null;
  let maxNum = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].num === 1) start = { row: r, col: c };
      if (grid[r][c].num > maxNum) {
        maxNum = grid[r][c].num;
        end = { row: r, col: c };
      }
    }
  }

  if (!start || !end) return false;

  const totalCells = rows * cols;
  let pathCount = 0;
  const visited = new Set<string>();

  function dfs(curr: Position): void {
    if (
      end &&
      curr.row === end.row &&
      curr.col === end.col &&
      visited.size === totalCells - 1
    ) {
      // Reached end, having visited all cells
      pathCount++;
      return;
    }

    visited.add(`${curr.row},${curr.col}`);
    const neighbors = getNeighbors(curr.row, curr.col, rows, cols);
    for (const { dir, pos } of neighbors) {
      if (
        !visited.has(`${pos.row},${pos.col}`) &&
        !grid[curr.row][curr.col].walls[dir]
      ) {
        dfs(pos);
        if (pathCount > 1) return; // Early exit if more than one path
      }
    }
    visited.delete(`${curr.row},${curr.col}`);
  }

  dfs(start);
  return pathCount === 1;
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
        visibleWalls: { N: false, S: false, E: false, W: false }, // No visible walls by default
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
  const maxRegenerationAttempts = 20;

  for (let attempt = 0; attempt < maxRegenerationAttempts; attempt++) {
    const { rows, cols } = getDimensionsForDifficulty(difficulty);

    let path: Position[] | null = null;
    let pathAttempts = 0;
    const maxPathAttempts = 100;

    while (!path && pathAttempts < maxPathAttempts) {
      path = generateHamiltonianPath(rows, cols);
      pathAttempts++;
    }

    if (!path) continue; // Try again

    const grid = createEmptyGrid(rows, cols);

    // Initialize all walls to TRUE (blocked) - then open along the path
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

    // Check if single path before blocking
    if (!isSinglePath(grid)) continue;

    // Wall blocking: only for hard difficulty to increase challenge
    // Easy/Medium: No visible walls - player explores freely
    // Hard: Add visible walls to block some non-path edges
    if (difficulty === "hard") {
      const pathEdges = new Set<string>();

      // Record edges that are part of the solution path
      for (let i = 0; i < path.length - 1; i++) {
        const curr = path[i];
        const next = path[i + 1];
        pathEdges.add(`${curr.row},${curr.col}-${next.row},${next.col}`);
        pathEdges.add(`${next.row},${next.col}-${curr.row},${curr.col}`);
      }

      // Find edges that are NOT on the solution path (these are already blocked internally)
      // We'll make some of them VISIBLE to help/hint the player
      const nonPathEdges: {
        cell: Position;
        dir: Direction;
        neighbor: Position;
      }[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const neighbors = getNeighbors(r, c, rows, cols);
          for (const { dir, pos } of neighbors) {
            // Only consider edges NOT on the solution path
            const edgeKey = `${r},${c}-${pos.row},${pos.col}`;
            if (pathEdges.has(edgeKey)) continue;

            // This edge is already blocked (walls[dir] = true), make it visible
            if (grid[r][c].walls[dir]) {
              nonPathEdges.push({
                cell: { row: r, col: c },
                dir,
                neighbor: pos,
              });
            }
          }
        }
      }

      // Shuffle and pick 3-6 walls to make visible
      for (let i = nonPathEdges.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nonPathEdges[i], nonPathEdges[j]] = [nonPathEdges[j], nonPathEdges[i]];
      }

      const numToShow = Math.min(
        nonPathEdges.length,
        3 + Math.floor(Math.random() * 4)
      ); // 3-6 visible walls

      for (let i = 0; i < numToShow; i++) {
        const { cell, dir, neighbor } = nonPathEdges[i];
        // Make these walls visible (they're already blocked internally)
        grid[cell.row][cell.col].visibleWalls[dir] = true;
        // Also set the opposite visible wall on the neighbor
        const oppositeDir = getOppositeDir(dir);
        grid[neighbor.row][neighbor.col].visibleWalls[oppositeDir] = true;
      }
    }

    // Return the grid (with or without walls depending on difficulty)
    return grid;
  }

  throw new Error(
    "Failed to generate puzzle with single path after max attempts"
  );
}
