import React from "react";
import { Cell as CellType } from "@/lib/game/types";
import { clsx } from "clsx";

interface CellProps {
  cell: CellType;
  isActive: boolean;
  isVisited: boolean;
  onPointerEnter: (row: number, col: number) => void;
  onPointerDown: (row: number, col: number) => void;
}

export function Cell({
  cell,
  isActive,
  isVisited,
  onPointerEnter,
  onPointerDown,
}: CellProps) {
  return (
    <div
      className={clsx(
        "relative flex items-center justify-center select-none touch-none transition-all duration-300",
        "w-full h-full text-2xl font-black rounded-2xl hover:scale-105",
        // Light pastel theme - pop colors
        isActive
          ? "bg-orange-200 z-10 border-2 border-white shadow-md"
          : isVisited
          ? "bg-blue-100 border border-blue-300"
          : "bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-200",
        // Visual wall indicators for blocked sides
        cell.walls.N && "border-t-4 border-gray-800",
        cell.walls.S && "border-b-4 border-gray-800",
        cell.walls.E && "border-r-4 border-gray-800",
        cell.walls.W && "border-l-4 border-gray-800"
      )}
      onPointerEnter={(e) => {
        // Only move if mouse button is held down (left click = 1)
        if (e.buttons === 1) {
          onPointerEnter(cell.row, cell.col);
        }
      }}
      onPointerDown={() => {
        // Click/tap always triggers move
        onPointerDown(cell.row, cell.col);
      }}
      data-row={cell.row}
      data-col={cell.col}
    >
      {/* Number Display - Disable pointer events to prevent Enter/Leave flickering */}
      {cell.num > 0 && (
        <span
          className={clsx(
            "z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] pointer-events-none transition-all duration-300",
            isVisited
              ? "text-orange-600 scale-125"
              : "text-orange-500 scale-100"
          )}
        >
          {cell.num}
        </span>
      )}
    </div>
  );
}
