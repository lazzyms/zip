"use client";
import { HelpCircle } from "lucide-react";

interface TopBarProps {
  onHelp: () => void;
}

export function TopBar({ onHelp }: TopBarProps) {
  return (
    <div className="flex justify-center items-center py-4 px-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl font-black tracking-tighter text-white">
          ZIP
        </span>
      </div>
      <button
        onClick={onHelp}
        className="ml-auto p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        aria-label="Help"
      >
        <HelpCircle size={24} />
      </button>
    </div>
  );
}
