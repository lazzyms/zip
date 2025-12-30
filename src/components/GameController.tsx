"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Grid as GridType, Position, GameState } from "@/lib/game/types";
import { GameBoard } from "./GameBoard";
import { TopBar } from "./TopBar";
import { BottomControls } from "./BottomControls";
import { OnboardingTooltip } from "./OnboardingTooltip";
import { RotateCcw, Play, Shuffle, Loader, X } from "lucide-react";
import {
  saveGameState,
  loadGameState,
  clearGameState,
  getSessionId,
  getPlayTimeMs,
  formatPlayTime,
  getSessionHighScore,
  updateSessionHighScore,
  getSolvedPuzzleIds,
  markPuzzleAsSolved,
} from "@/lib/storage/gameState";

interface GameContextState extends GameState {
  difficulty?: "easy" | "medium" | "hard";
  gridJson?: string;
  startTime?: number;
  puzzleId?: number;
}

export function GameController() {
  const [gameState, setGameState] = useState<GameContextState>({
    grid: [],
    path: [],
    size: { rows: 6, cols: 6 },
    maxNum: 0,
    status: "playing",
  });

  // History State
  const [history, setHistory] = useState<Position[][]>([]);
  const [future, setFuture] = useState<Position[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasResumable, setHasResumable] = useState(false);
  const [playTimeMs, setPlayTimeMs] = useState(0);
  const [puzzleStats, setPuzzleStats] = useState<{
    easy: number;
    medium: number;
    hard: number;
    total: number;
  } | null>(null);
  const [sessionHighScore, setSessionHighScore] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hintPosition, setHintPosition] = useState<Position | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem("onboardingCompleted");
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const handleHelp = () => {
    setShowHelp(true);
  };

  const handleHint = () => {
    if (gameState.path.length === 0) return;
    const last = gameState.path[gameState.path.length - 1];
    const possible: Position[] = [];
    // Check up
    if (last.row > 0 && !gameState.grid[last.row][last.col].walls.N) {
      const pos = { row: last.row - 1, col: last.col };
      if (!gameState.path.some((p) => p.row === pos.row && p.col === pos.col)) {
        possible.push(pos);
      }
    }
    // Check down
    if (
      last.row < gameState.size.rows - 1 &&
      !gameState.grid[last.row][last.col].walls.S
    ) {
      const pos = { row: last.row + 1, col: last.col };
      if (!gameState.path.some((p) => p.row === pos.row && p.col === pos.col)) {
        possible.push(pos);
      }
    }
    // Check left
    if (last.col > 0 && !gameState.grid[last.row][last.col].walls.W) {
      const pos = { row: last.row, col: last.col - 1 };
      if (!gameState.path.some((p) => p.row === pos.row && p.col === pos.col)) {
        possible.push(pos);
      }
    }
    // Check right
    if (
      last.col < gameState.size.cols - 1 &&
      !gameState.grid[last.row][last.col].walls.E
    ) {
      const pos = { row: last.row, col: last.col + 1 };
      if (!gameState.path.some((p) => p.row === pos.row && p.col === pos.col)) {
        possible.push(pos);
      }
    }
    if (possible.length > 0) {
      setHintPosition(possible[0]);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem("onboardingCompleted", "true");
  };

  const initGame = useCallback(async (resumeSaved: boolean = false) => {
    setIsLoading(true);
    setLoadError(null);
    setPlayTimeMs(0); // Reset play time when starting new game

    try {
      let newGrid: GridType;
      let difficulty: "easy" | "medium" | "hard" = "medium";
      let initialPath: Position[];
      let maxNum = 0;
      let startTime: number | undefined = undefined;

      // Try to resume saved game if requested
      if (resumeSaved) {
        const saved = loadGameState();
        if (saved) {
          try {
            newGrid = JSON.parse(saved.gridJson);
            difficulty = saved.difficulty;
            initialPath = saved.path;
            startTime = saved.startTime;
            maxNum = Math.max(...newGrid.flat().map((c) => c.num || 0));

            setGameState({
              grid: newGrid,
              path: initialPath,
              size: { rows: newGrid.length, cols: newGrid[0]?.length || 5 },
              maxNum,
              status: saved.status,
              difficulty,
              gridJson: saved.gridJson,
              startTime,
            });
            setHistory([]);
            setFuture([]);
            setIsLoading(false);
            setHasResumable(false);
            return;
          } catch (e) {
            console.error("Failed to resume game:", e);
            clearGameState();
          }
        }
      }

      // Fetch new puzzle from server API
      const solvedIds = getSolvedPuzzleIds();
      const excludedIdsParam =
        solvedIds.length > 0 ? `?excludedIds=${solvedIds.join(",")}` : "";
      const response = await fetch(`/api/puzzle${excludedIdsParam}`);

      if (!response.ok) {
        throw new Error("Failed to fetch puzzle");
      }

      const data = await response.json();
      newGrid = data.grid as GridType;
      difficulty = data.difficulty;
      const puzzleId = data.puzzleId;

      let startPos: Position = { row: 0, col: 0 };
      newGrid.flat().forEach((cell) => {
        if (cell.num === 1) startPos = { row: cell.row, col: cell.col };
        if (cell.num > maxNum) maxNum = cell.num;
      });

      initialPath = [startPos];
      setGameState({
        grid: newGrid,
        path: initialPath,
        size: { rows: newGrid.length, cols: newGrid[0]?.length || 5 },
        maxNum,
        status: "playing",
        difficulty,
        gridJson: JSON.stringify(newGrid),
        startTime,
        puzzleId,
      });
      setHistory([]);
      setFuture([]);
      setHasResumable(false);
    } catch (error) {
      console.error("Failed to initialize game:", error);
      setLoadError("Failed to load puzzle. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initialize game on mount
    initGame();

    // Check for resumable game
    const saved = loadGameState();
    setHasResumable(!!saved && saved.status === "playing");

    // Load session high score
    setSessionHighScore(getSessionHighScore());
  }, [initGame]);

  // Separate effect for fetching puzzle stats with auto-refresh
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/puzzle-stats");
        const data = await res.json();
        setPuzzleStats(data);
      } catch (err) {
        console.error("Failed to fetch puzzle stats:", err);
      }
    };

    // Fetch once on mount (no polling)
    fetchStats();
  }, []);

  // Auto-start timer after 1.5 seconds if player hasn't made a move
  useEffect(() => {
    if (gameState.status !== "playing" || gameState.startTime) return;

    const timeout = setTimeout(() => {
      setGameState((prev) => {
        // Only set if still undefined
        if (!prev.startTime) {
          return { ...prev, startTime: Date.now() };
        }
        return prev;
      });
    }, 1500);

    return () => clearTimeout(timeout);
  }, [gameState.status, gameState.startTime]);

  // Separate effect for play time tracking
  useEffect(() => {
    if (!gameState.startTime || gameState.status !== "playing") return;

    // Update play time every second only while playing
    const interval = setInterval(() => {
      setPlayTimeMs(getPlayTimeMs(gameState.startTime!));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.startTime, gameState.status]);

  // Controls
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prevPath = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    setFuture((prev) => [gameState.path, ...prev]);
    setHistory(newHistory);
    setGameState((prev) => ({ ...prev, path: prevPath, status: "playing" }));
  }, [history, gameState.path]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const nextPath = future[0];
    const newFuture = future.slice(1);

    setHistory((prev) => [...prev, gameState.path]);
    setFuture(newFuture);
    setGameState((prev) => ({ ...prev, path: nextPath, status: "playing" })); // Re-check win might be needed if redoing winning move?
    // Actually simplicity: if redone path is full & valid, status will check on next move?
    // Wait, status is derived in handleMove.
    // We should probably re-derive status or store it in history.
    // For now, assume 'playing' unless it was the winning move.
    // Let's keep it simple: 'playing'. User can make 1 move to win again.
  }, [future, gameState.path]);

  const handleReset = useCallback(() => {
    if (gameState.path.length <= 1) return;
    setHistory((prev) => [...prev, gameState.path]);
    setFuture([]);
    // Reset to just the start position
    setGameState((prev) => ({
      ...prev,
      path: [prev.path[0]],
      status: "playing",
    }));
  }, [gameState.path]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "r") {
        // Optional: R to reset? Maybe too dangerous.
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleMove = (pos: Position) => {
    if (gameState.status !== "playing") return;

    const currentPath = gameState.path;
    const currentPos = currentPath[currentPath.length - 1];

    // Check if clicking on a cell already in the path - erase back to that point
    const pathIndex = currentPath.findIndex(
      (p) => p.row === pos.row && p.col === pos.col
    );
    if (pathIndex >= 0) {
      // Erase path from this point onwards
      const newPath = currentPath.slice(0, pathIndex + 1);
      setHistory((prev) => [...prev, currentPath]);
      setFuture([]);
      setGameState((prev) => ({
        ...prev,
        path: newPath,
        status: "playing",
      }));
      return;
    }

    // Check adjacency (only orthogonal moves allowed)
    const dRow = Math.abs(pos.row - currentPos.row);
    const dCol = Math.abs(pos.col - currentPos.col);
    if (!((dRow === 1 && dCol === 0) || (dRow === 0 && dCol === 1))) return;

    // Checkpoint validation: if moving to a checkpoint, must have visited previous checkpoint
    const targetCell = gameState.grid[pos.row][pos.col];
    if (targetCell.num > 0) {
      // User is moving to a numbered checkpoint
      let lastNum = 0;
      for (let i = currentPath.length - 1; i >= 0; i--) {
        const p = currentPath[i];
        const n = gameState.grid[p.row][p.col].num;
        if (n > 0) {
          lastNum = n;
          break;
        }
      }
      // Can only move to the next checkpoint in sequence
      if (targetCell.num !== lastNum + 1) return;
    }

    // Allow move to any adjacent unvisited cell (or back to visited cells to erase)
    const newPath = [...currentPath, pos];

    // Start timer on first move if not already started
    const newStartTime =
      gameState.startTime ||
      (currentPath.length === 1 ? Date.now() : undefined);

    // Save to history before state update
    setHistory((prev) => [...prev, currentPath]);
    setFuture([]);

    // Check win condition: path must visit all cells AND end on final checkpoint
    const isFull =
      newPath.length === gameState.grid.length * gameState.grid[0].length;
    const isAtEnd = targetCell.num === gameState.maxNum;

    let status: "playing" | "won" | "lost" = "playing";
    if (isAtEnd && isFull) status = "won";

    const newGameState = {
      ...gameState,
      path: newPath,
      status,
      startTime: newStartTime,
    };

    setGameState(newGameState);

    // Save game state to localStorage
    if (gameState.gridJson && gameState.difficulty) {
      saveGameState(newGameState, gameState.difficulty, gameState.gridJson);
    }

    // Log analytics if game won
    if (status === "won") {
      const playTime = gameState.startTime
        ? getPlayTimeMs(gameState.startTime)
        : 0;

      // Mark puzzle as solved
      if (gameState.puzzleId) {
        markPuzzleAsSolved(gameState.puzzleId);
      }

      // Check and update high score
      const isNewHighScore = updateSessionHighScore(playTime);
      if (isNewHighScore) {
        setSessionHighScore(playTime);
        setIsNewRecord(true);
      }

      logGameCompletion({
        difficulty: gameState.difficulty || "medium",
        playTimeMs: playTime,
        moveCount: newPath.length,
      });
    }
    setHintPosition(null);
  };

  // Analytics logging
  const logGameCompletion = useCallback(
    async (data: {
      difficulty: "easy" | "medium" | "hard";
      playTimeMs: number;
      moveCount: number;
    }) => {
      try {
        await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: getSessionId(),
            difficulty: data.difficulty,
            completed: true,
            playTimeMs: data.playTimeMs,
            moveCount: data.moveCount,
          }),
        });
        clearGameState();
      } catch (error) {
        console.error("Failed to log analytics:", error);
      }
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar onHelp={handleHelp} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <Loader size={48} className="text-blue-500 animate-spin" />
            <p className="text-neutral-400">Loading puzzle...</p>
            {hasResumable && (
              <button
                onClick={() => initGame(true)}
                className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all flex items-center gap-2"
              >
                <Play size={18} />
                Resume Game
              </button>
            )}
          </div>
        </div>
        <BottomControls
          onUndo={handleUndo}
          onHint={handleHint}
          canUndo={false}
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col h-full">
        <TopBar onHelp={handleHelp} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-sm">
            <div className="text-5xl">⚠️</div>
            <p className="text-neutral-400 text-center">{loadError}</p>
            <button
              onClick={() => initGame()}
              className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
        <BottomControls
          onUndo={handleUndo}
          onHint={handleHint}
          canUndo={false}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar onHelp={handleHelp} />
      <div className="flex-1 flex items-center justify-center p-4">
        <GameBoard
          grid={gameState.grid}
          path={gameState.path}
          onMove={handleMove}
          hintPosition={hintPosition}
        />
      </div>
      <BottomControls
        onUndo={handleUndo}
        onHint={handleHint}
        canUndo={history.length > 0}
      />

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-neutral-800 border border-neutral-700 p-6 rounded-2xl max-w-sm mx-4 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Game Rules</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Close help"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-neutral-300 space-y-2">
              <p>Connect the numbered dots in order (1 → 2 → 3 → …).</p>
              <p>Draw one continuous path.</p>
              <p>The path must:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Stay inside the grid</li>
                <li>Fill every cell</li>
                <li>Not cross itself</li>
                <li>No skipping numbers or revisiting cells.</li>
              </ul>
              <p>
                Puzzle is complete only when all cells are filled correctly.
              </p>
            </div>
          </div>
        </div>
      )}

      <OnboardingTooltip
        isVisible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {gameState.status === "won" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-white border-2 border-blue-300 p-6 sm:p-8 rounded-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4 shadow-lg">
            <div className="text-5xl sm:text-6xl animate-bounce">
              {isNewRecord ? "🏆" : "🎉"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-blue-600">
              {isNewRecord ? "NEW RECORD!" : "SOLVED!"}
            </h2>
            <p className="text-sm text-gray-700 text-center">
              {isNewRecord ? (
                <>
                  🎊 Amazing! You set a new personal best!
                  <br />
                  <span className="font-bold text-blue-600">
                    {formatPlayTime(playTimeMs)}
                  </span>
                </>
              ) : (
                <>
                  Amazing! You completed the puzzle in{" "}
                  <span className="font-bold">
                    {formatPlayTime(playTimeMs)}
                  </span>
                  {sessionHighScore !== null && (
                    <>
                      <br />
                      <span className="text-xs text-gray-500">
                        Best: {formatPlayTime(sessionHighScore)}
                      </span>
                    </>
                  )}
                </>
              )}
            </p>
            <button
              onClick={() => {
                setIsNewRecord(false);
                initGame(false);
              }}
              className="mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold transition-transform hover:scale-105 w-full border border-blue-300"
            >
              Next Level
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
