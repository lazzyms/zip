# Copilot Instructions for "Zip" Project

## Project Overview

A Next.js puzzle game where players connect numbered cells (1 to N) in sequence without crossing walls or revisiting cells. Built with React, TypeScript, TailwindCSS, and Drizzle ORM with SQLite.

## Architecture

### Core Game Layers

- **Generator** (`src/lib/game/generator.ts`): Algorithm generates solvable mazes with difficulty-based parameters. Uses recursive backtracking to create paths, then strategically places numbered checkpoints. Difficulty affects grid size (4x4 to 6x6) and checkpoint density (60% → 15%).
- **Types** (`src/lib/game/types.ts`): Core game domain—`Grid` (2D Cell array), `Cell` (position + walls + number), `GameState` (grid + path + status).
- **Storage** (`src/lib/game/storage.ts`): Database layer using Drizzle ORM. Functions: `generatePuzzle()`, `savePuzzle()`, `getRandomPuzzle()`, `getPuzzleCountByDifficulty()`.

### Client-Side Game Logic

- **GameController** (`src/components/GameController.tsx`): Central state management. Handles:
  - Undo/redo history (`history[]` & `future[]` stacks)
  - Local game state with localStorage persistence (resume ability)
  - Session tracking via `getSessionId()` for analytics
  - Win/loss detection and analytics reporting
- **Grid Component** (`src/components/Grid.tsx`): Renders 2D game board. Manages pointer interactions for path-building.
- **Cell Component** (`src/components/Cell.tsx`): Individual cell UI with Framer Motion animations. Visual states: active (orange), visited (blue), unvisited (white). Wall rendering is hidden for puzzle discovery.

### Data Persistence

- **localStorage**: Game state saved to `zip_game_state` key (gridJson, path, status, difficulty, startTime).
- **SQLite Database** (`.data/zip.db`):
  - `puzzles` table: Pre-generated puzzles with difficulty, completion stats, avg play time.
  - `analytics` table: Session logs (sessionId, difficulty, completion status, playTimeMs, moveCount).

### Scheduled Tasks

- **Scheduler** (`src/lib/scheduler/index.ts`): Node-schedule keeps puzzle pool replenished. Runs background job to generate puzzles when count drops below 10 per difficulty. Started via Next.js instrumentation hook.

## Development Workflows

### Build & Run

```bash
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Production build
npm start          # Run production server
npm run lint       # ESLint check
```

### Database

- **Schema changes**: Edit [src/lib/db/schema.ts](src/lib/db/schema.ts), then run `npx drizzle-kit generate` to generate migrations (stored in `drizzle/` folder).
- **Initial setup**: DB auto-initializes in `src/lib/db/index.ts` using Drizzle query interface.

## Key Patterns & Conventions

### 1. Client Component Usage

Use `"use client"` directive for interactive components. [GameController.tsx](src/components/GameController.tsx) and child components are client-side due to React state management.

### 2. Path Alias Imports

All imports use `@/` prefix mapped to `src/` (tsconfig.json: `"@/*": ["./src/*"]`). Example: `import { GameState } from "@/lib/game/types"`.

### 3. State Management Pattern

- `gameState`: Core game data (grid, path, status, size, maxNum, difficulty, gridJson, startTime).
- `history`/`future`: Undo/redo stacks of path states. Only path is versioned, not full game state.
- Save on every significant change using `saveGameState()` to enable resume.

### 4. Difficulty Levels

Three tiers affect generation:

- `easy`: 4–5 rows × 4 cols, 60% checkpoint density
- `medium`: 5×5, 40% checkpoint density
- `hard`: 6×6, 15% checkpoint density

### 5. Animations & Styling

- **Framer Motion**: Cell transitions use `motion` from `framer-motion`.
- **Tailwind CSS**: Utility-first. Use `clsx` for conditional class merging.
- **Color Palette**: Pastel theme—orange (active), blue (visited), white (default).

### 6. API Routes Pattern

- **GET /api/puzzle**: Returns random puzzle (with 5-min HTTP cache). Uses `getRandomPuzzle()`.
- **POST /api/analytics**: Logs session completion. Updates puzzle stats (completions, avgPlayTimeMs).

### 7. Session Tracking

- `getSessionId()`: Generates unique session ID on first load, stored in sessionStorage.
- `formatPlayTime()`: Converts milliseconds to human-readable format (MM:SS).
- All analytics tied to sessionId for tracking player patterns.

## Critical Files for Feature Work

| File                                                                   | Purpose                       | Key Export                                             |
| ---------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------ |
| [src/lib/game/types.ts](src/lib/game/types.ts)                         | Game domain types             | `GameState`, `Cell`, `Grid`, `Direction`, `Walls`      |
| [src/lib/game/generator.ts](src/lib/game/generator.ts)                 | Puzzle generation algorithm   | `generatePuzzle(options: GeneratorOptions)`            |
| [src/lib/game/storage.ts](src/lib/game/storage.ts)                     | Database CRUD operations      | `getRandomPuzzle()`, `savePuzzle()`                    |
| [src/components/GameController.tsx](src/components/GameController.tsx) | Game state orchestration      | Exports `GameController` component                     |
| [src/lib/storage/gameState.ts](src/lib/storage/gameState.ts)           | Client-side persistence       | `saveGameState()`, `loadGameState()`, `getSessionId()` |
| [src/lib/db/schema.ts](src/lib/db/schema.ts)                           | Drizzle ORM table definitions | `puzzles`, `analytics` tables                          |

## Common Development Tasks

**Add new difficulty level**: Update [src/lib/game/generator.ts](src/lib/game/generator.ts) (getDimensionsForDifficulty, getCheckpointDensityForDifficulty), [src/lib/game/types.ts](src/lib/game/types.ts) (Difficulty type), and scheduler replenish logic.

**Modify puzzle generation**: Alter algorithm logic in `generatePuzzle()` function. Test by loading puzzles via `/api/puzzle` endpoint.

**Change analytics captured**: Add fields to `analytics` table in [schema.ts](src/lib/db/schema.ts), regenerate migrations, and update POST handler in [src/app/api/analytics/route.ts](src/app/api/analytics/route.ts).

**Customize UI appearance**: Edit Cell, Grid, or GameController classes. Animations are in [Cell.tsx](src/components/Cell.tsx) using Framer Motion.

## Notes for AI Agents

- Drizzle queries do NOT require await for read operations in certain contexts, but always use `await` for safety.
- Wall logic is internal; UI intentionally hides walls for puzzle discovery.
- localStorage only works client-side; guard with `if (typeof window === "undefined")` in server functions.
- The scheduler runs on app startup—check [src/instrumentation.ts](src/instrumentation.ts) for initialization.
