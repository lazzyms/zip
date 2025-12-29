"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Grid as GridType,
  Position,
  GameState,
  Direction,
} from "@/lib/game/types";
import { Grid } from "./Grid";
import { RotateCcw, Play, Shuffle, Loader } from "lucide-react";
import { clsx } from "clsx";
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
    size: { rows: 5, cols: 5 },
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
    const fetchStats = () => {
      fetch("/api/puzzle-stats")
        .then((res) => res.json())
        .then((data) => setPuzzleStats(data))
        .catch((err) => console.error("Failed to fetch puzzle stats:", err));
    };

    // Fetch immediately
    fetchStats();

    // Refresh every 5 seconds to show live updates
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6">
          <Loader size={48} className="text-orange-500 animate-spin" />
          <p className="text-gray-600">Loading puzzle...</p>

          {hasResumable && (
            <button
              onClick={() => initGame(true)}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white font-bold transition-all flex items-center gap-2 border border-purple-300"
            >
              <Play size={18} />
              Resume Game
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <div className="text-5xl">⚠️</div>
          <p className="text-gray-600 text-center">{loadError}</p>
          <button
            onClick={() => initGame()}
            className="px-6 py-2 rounded-full bg-orange-400 hover:bg-orange-500 text-white font-bold transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 w-full max-w-md mx-auto">
      <div className="flex justify-between w-full px-3 sm:px-4 items-center mb-4 sm:mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/20 border-2 border-orange-400/50 flex items-center justify-center transform hover:scale-110 transition-transform">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-orange-500 sr-only">
              ZIP
            </h1>
            <span
              className="text-4xl sm:text-6xl font-black tracking-tighter text-orange-500 relative"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM10 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' fill='%23000' fill-opacity='0.1'/%3E%3C/svg%3E")`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
              }}
            >
              ZIP
              <span
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 1a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM6 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6z' fill='%23000'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "repeat",
                  mixBlendMode: "overlay",
                }}
              ></span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <span className="px-2 py-1 rounded-full bg-white/60 border border-orange-300">
              {gameState.difficulty || "medium"}
            </span>
            {playTimeMs > 0 && (
              <span className="px-2 py-1 rounded-full bg-white/60 border border-orange-300">
                ⏱️ {formatPlayTime(playTimeMs)}
              </span>
            )}
            {puzzleStats && (
              <span
                className="px-2 py-1 rounded-full bg-white/60 border border-purple-300"
                title={`Easy: ${puzzleStats.easy} | Medium: ${puzzleStats.medium} | Hard: ${puzzleStats.hard}`}
              >
                🧩 {puzzleStats.total}
              </span>
            )}
            {sessionHighScore !== null && (
              <span
                className="px-2 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-400"
                title="Session Best Time"
              >
                🏆 {formatPlayTime(sessionHighScore)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleReset}
          disabled={gameState.path.length <= 1}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 px-2 sm:px-3 py-1 bg-orange-100 rounded-full transition-colors disabled:opacity-30 disabled:hover:text-orange-600 hover:bg-orange-200"
          title="Reset Level"
        >
          RESET
        </button>
      </div>

      <Grid
        grid={gameState.grid}
        path={gameState.path}
        onMove={handleMove}
        gameStatus={gameState.status}
      />

      <div className="flex gap-2 sm:gap-4 items-center mt-6 sm:mt-8 w-full justify-center">
        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="p-2 sm:p-4 rounded-full bg-orange-100 hover:bg-orange-200 disabled:opacity-30 disabled:cursor-not-allowed text-orange-600 transition-all active:scale-95 border border-orange-200 hover:border-orange-300"
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw size={24} />
        </button>

        {/* New Game Button */}
        <button
          onClick={() => initGame(false)}
          className="px-6 sm:px-8 py-2 sm:py-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-sm sm:text-lg transition-all active:scale-95 flex items-center gap-2 border border-orange-300"
        >
          <Shuffle size={20} />
          <span className="hidden sm:inline">New Game</span>
          <span className="sm:hidden">New</span>
        </button>

        {/* Redo Button */}
        <button
          onClick={handleRedo}
          disabled={future.length === 0}
          className="p-2 sm:p-4 rounded-full bg-purple-100 hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed text-purple-600 transition-all active:scale-95 border border-purple-200 hover:border-purple-300"
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
        >
          <RotateCcw size={24} className="scale-x-[-1]" />
        </button>
      </div>

      {gameState.status === "won" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-white border-2 border-orange-300 p-6 sm:p-8 rounded-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4 shadow-lg">
            <div className="text-5xl sm:text-6xl animate-bounce">
              {isNewRecord ? "🏆" : "🎉"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-orange-600">
              {isNewRecord ? "NEW RECORD!" : "SOLVED!"}
            </h2>
            <p className="text-sm text-gray-700 text-center">
              {isNewRecord ? (
                <>
                  🎊 Amazing! You set a new personal best!
                  <br />
                  <span className="font-bold text-orange-600">
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
              className="mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold transition-transform hover:scale-105 w-full border border-orange-300"
            >
              Next Level
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
