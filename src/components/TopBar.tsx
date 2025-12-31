"use client";
import { HelpCircle } from "lucide-react";
import { formatPlayTime } from "@/lib/storage/gameState";

interface TopBarProps {
  onHelp: () => void;
  playTimeMs: number;
  overallHighScore: number | null;
}

export function TopBar({ onHelp, playTimeMs, overallHighScore }: TopBarProps) {
  return (
    <div className="flex justify-between items-center py-4 px-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl font-black tracking-tighter text-white">
          ZIP
        </span>
        <div className="text-white text-sm">
          <div>Time: {formatPlayTime(playTimeMs)}</div>
          <div>
            Best:{" "}
            {overallHighScore
              ? formatPlayTime(overallHighScore)
              : "No highscore yet"}
          </div>
        </div>
      </div>
      <button
        onClick={onHelp}
        className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        aria-label="Help"
      >
        <HelpCircle size={24} />
      </button>
    </div>
  );
}
