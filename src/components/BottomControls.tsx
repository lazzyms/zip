"use client";
import { RotateCcw, Lightbulb } from "lucide-react";

interface BottomControlsProps {
  onUndo: () => void;
  onHint: () => void;
  canUndo: boolean;
}

export function BottomControls({
  onUndo,
  onHint,
  canUndo,
}: BottomControlsProps) {
  return (
    <div className="flex justify-center items-center py-4 px-4 gap-4">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="px-6 py-3 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all active:scale-95 flex items-center gap-2"
        aria-label="Undo"
      >
        <RotateCcw size={20} />
        Undo
      </button>
      <button
        onClick={onHint}
        className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all active:scale-95 flex items-center gap-2"
        aria-label="Hint"
      >
        <Lightbulb size={20} />
        Hint
      </button>
    </div>
  );
}
