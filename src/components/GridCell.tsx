"use client";
import React from "react";
import { Cell as CellType } from "@/lib/game/types";
import { clsx } from "clsx";
import { Node } from "./Node";

interface GridCellProps {
  cell: CellType;
  isActive: boolean;
  isVisited: boolean;
  onPointerEnter: () => void;
  onPointerDown: () => void;
  isHint: boolean;
}

export function GridCell({
  cell,
  isActive,
  isVisited,
  onPointerEnter,
  onPointerDown,
  isHint,
}: GridCellProps) {
  return (
    <div
      className={clsx(
        "relative flex items-center justify-center select-none touch-none transition-all duration-300",
        "w-full h-full rounded-2xl hover:scale-105",
        // Dark theme - neutral colors
        isActive
          ? "bg-blue-500 z-10 border-2 border-white shadow-md"
          : isVisited
          ? "bg-blue-900 border border-blue-700"
          : "bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 hover:border-neutral-500",
        isHint && "ring-2 ring-blue-400"
      )}
      onPointerEnter={(e) => {
        // Only move if mouse button is held down (left click = 1)
        if (e.buttons === 1) {
          onPointerEnter();
        }
      }}
      onPointerDown={() => {
        // Click/tap always triggers move
        onPointerDown();
      }}
      data-row={cell.row}
      data-col={cell.col}
    >
      {/* Node Display */}
      {cell.num > 0 && <Node num={cell.num} isVisited={isVisited} />}
    </div>
  );
}
