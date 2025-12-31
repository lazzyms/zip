"use client";
import { RotateCcw, Lightbulb, Shuffle, RefreshCw } from "lucide-react";

interface BottomControlsProps {
  onUndo: () => void;
  onHint: () => void;
  canUndo: boolean;
  onNewGame: () => void;
  onReset: () => void;
  canReset: boolean;
}

export function BottomControls({
  onUndo,
  onHint,
  canUndo,
  onNewGame,
  onReset,
  canReset,
}: BottomControlsProps) {
  return (
    <div className="flex justify-center items-center py-4 px-4 gap-4">
      <button
        onClick={onNewGame}
        className="px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-all active:scale-95 flex items-center gap-2"
        aria-label="New Game"
      >
        <Shuffle size={20} />
        New Game
      </button>
      <button
        onClick={onReset}
        disabled={!canReset}
        className="px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all active:scale-95 flex items-center gap-2"
        aria-label="Reset"
      >
        <RefreshCw size={20} />
        Reset
      </button>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="px-6 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all active:scale-95 flex items-center gap-2"
        aria-label="Undo"
      >
        <RotateCcw size={20} />
        Undo
      </button>
      <button
        onClick={onHint}
        className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all active:scale-95 flex items-center gap-2"
        aria-label="Hint"
      >
        <Lightbulb size={20} />
        Hint
      </button>
    </div>
  );
}
