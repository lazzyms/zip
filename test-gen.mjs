// Quick test of puzzle generation
const { generatePuzzle } = require("./src/lib/game/generator");

console.log("Testing puzzle generation...\n");

for (const d of ["easy", "medium", "hard"]) {
  try {
    const p = generatePuzzle({ difficulty: d });
    let vw = 0;
    let tw = 0;
    p.forEach((r) =>
      r.forEach((c) => {
        if (c.visibleWalls) {
          if (c.visibleWalls.N) vw++;
          if (c.visibleWalls.S) vw++;
          if (c.visibleWalls.E) vw++;
          if (c.visibleWalls.W) vw++;
        }
        if (c.walls.N) tw++;
        if (c.walls.S) tw++;
        if (c.walls.E) tw++;
        if (c.walls.W) tw++;
      })
    );
    console.log(`${d}: ${p.length}x${p[0].length}`);
    console.log(`  Total internal walls: ${tw}`);
    console.log(`  Visible walls: ${vw}`);
  } catch (e) {
    console.log(`${d}: ERROR - ${e.message}`);
  }
}
