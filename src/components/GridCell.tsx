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

const GridCellInner = function GridCellInner({
  cell,
  isActive,
  isVisited,
  onPointerEnter,
  onPointerDown,
  isHint,
}: GridCellProps) {
  // Build box-shadow for visible walls only (not internal path validation walls)
  const wallShadows: string[] = [];
  const wallThickness = 3;

  // Only show visibleWalls - these are walls added for hard difficulty
  if (cell.visibleWalls?.N)
    wallShadows.push(`0 -${wallThickness}px 0 0 rgb(255, 255, 255)`);
  if (cell.visibleWalls?.S)
    wallShadows.push(`0 ${wallThickness}px 0 0 rgb(255, 255, 255)`);
  if (cell.visibleWalls?.W)
    wallShadows.push(`-${wallThickness}px 0 0 0 rgb(255, 255, 255)`);
  if (cell.visibleWalls?.E)
    wallShadows.push(`${wallThickness}px 0 0 0 rgb(255, 255, 255)`);

  return (
    <div
      className={clsx(
        "relative flex items-center justify-center select-none touch-none transition-all duration-300",
        "w-full h-full hover:scale-105 rounded-lg",
        // Dark theme - boring colors
        isActive
          ? "bg-gray-600 z-10 border-2 border-gray-300"
          : isVisited
          ? "bg-gray-700 border border-gray-600"
          : "bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600",
        isHint && "ring-2 ring-gray-400"
      )}
      style={{
        boxShadow: wallShadows.length > 0 ? wallShadows.join(", ") : undefined,
      }}
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
};

export const GridCell = React.memo(GridCellInner);
