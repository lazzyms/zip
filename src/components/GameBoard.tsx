"use client";
import React, { useRef, useEffect } from "react";
import { Grid as GridType, Position } from "@/lib/game/types";
import { GridCell } from "./GridCell";
import { PathLayer } from "./PathLayer";

interface GameBoardProps {
  grid: GridType;
  path: Position[];
  onMove: (to: Position) => void;
  hintPosition: Position | null;
}

export function GameBoard({
  grid,
  path,
  onMove,
  hintPosition,
}: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to check efficiently
  const isVisited = (r: number, c: number) =>
    path.some((p) => p.row === r && p.col === c);
  const isLast = (r: number, c: number) => {
    const last = path[path.length - 1];
    return last && last.row === r && last.col === c;
  };

  // Handle touch moving across elements
  useEffect(() => {
    let isMouseDown = false;

    const handleMouseDown = () => {
      isMouseDown = true;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;

      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);

      if (containerRef.current.contains(target as Node)) {
        e.preventDefault(); // Stop scroll
      }

      // Find the cell data attributes
      const cellDiv = target?.closest("[data-row]");
      if (cellDiv) {
        const r = parseInt(cellDiv.getAttribute("data-row") || "-1");
        const c = parseInt(cellDiv.getAttribute("data-col") || "-1");
        if (r >= 0 && c >= 0) {
          onMove({ row: r, col: c });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const cellDiv = target?.closest("[data-row]");
      if (cellDiv) {
        const r = parseInt(cellDiv.getAttribute("data-row") || "-1");
        const c = parseInt(cellDiv.getAttribute("data-col") || "-1");
        if (r >= 0 && c >= 0) {
          onMove({ row: r, col: c });
        }
      }
    };

    const current = containerRef.current;
    if (current) {
      current.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      current.addEventListener("mousedown", handleMouseDown);
      current.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      current?.removeEventListener("touchmove", handleTouchMove);
      current?.removeEventListener("mousedown", handleMouseDown);
      current?.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [onMove]);

  const rows = grid.length;
  if (rows === 0) return null; // Handle loading state
  const cols = grid[0].length;

  return (
    <div
      ref={containerRef}
      className="relative select-none touch-none bg-neutral-800 p-2 sm:p-3 md:p-4 rounded-3xl border border-neutral-600"
      style={{
        display: "grid",
        gap:
          window.innerWidth < 640
            ? "4px"
            : window.innerWidth < 768
            ? "5px"
            : "6px",
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        aspectRatio: `${cols}/${rows}`,
        width: "100%",
        maxWidth: "500px",
      }}
    >
      {/* Render Cells */}
      {grid.map((row, r) =>
        row.map((cell, c) => (
          <GridCell
            key={`${r}-${c}`}
            cell={cell}
            isActive={isLast(r, c)}
            isVisited={isVisited(r, c)}
            isHint={
              !!(
                hintPosition &&
                hintPosition.row === r &&
                hintPosition.col === c
              )
            }
            onPointerEnter={() => onMove({ row: r, col: c })}
            onPointerDown={() => onMove({ row: r, col: c })}
          />
        ))
      )}

      {/* Path Layer */}
      <PathLayer path={path} rows={rows} cols={cols} />
    </div>
  );
}
