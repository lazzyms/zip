import { generatePuzzle } from "../src/lib/game/generator";

console.log("Testing EASY/MEDIUM (should have NO visible walls):");
for (let i = 0; i < 2; i++) {
  const puzzle = generatePuzzle({ difficulty: i === 0 ? "easy" : "medium" });
  let visibleWallCount = 0;
  puzzle.forEach((row) =>
    row.forEach((cell) => {
      if (cell.visibleWalls?.N) visibleWallCount++;
      if (cell.visibleWalls?.S) visibleWallCount++;
      if (cell.visibleWalls?.E) visibleWallCount++;
      if (cell.visibleWalls?.W) visibleWallCount++;
    })
  );
  console.log(
    `  ${i === 0 ? "Easy" : "Medium"}: ${puzzle.length}x${
      puzzle[0].length
    }, ${visibleWallCount} visible walls`
  );
}

console.log("\nTesting HARD (should have 2-4 visible walls):");
for (let i = 0; i < 3; i++) {
  const puzzle = generatePuzzle({ difficulty: "hard" });
  let visibleWallCount = 0;
  const wallCells: string[] = [];
  puzzle.forEach((row) =>
    row.forEach((cell) => {
      const walls = [];
      if (cell.visibleWalls?.N) {
        visibleWallCount++;
        walls.push("N");
      }
      if (cell.visibleWalls?.S) {
        visibleWallCount++;
        walls.push("S");
      }
      if (cell.visibleWalls?.E) {
        visibleWallCount++;
        walls.push("E");
      }
      if (cell.visibleWalls?.W) {
        visibleWallCount++;
        walls.push("W");
      }
      if (walls.length > 0)
        wallCells.push(`[${cell.row},${cell.col}]:${walls.join("")}`);
    })
  );
  console.log(
    `  Hard ${i + 1}: ${puzzle.length}x${
      puzzle[0].length
    }, ${visibleWallCount} visible wall edges`
  );
  if (wallCells.length > 0)
    console.log(`    Walls at: ${wallCells.join(", ")}`);
}
