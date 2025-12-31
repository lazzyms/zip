import React, { useRef, useEffect, useMemo } from "react";
import { Cell as CellComp } from "./Cell";
import { Grid as GridType, Position } from "@/lib/game/types";
import { motion } from "framer-motion";

interface GridProps {
  grid: GridType;
  path: Position[];
  onMove: (to: Position) => void;
}

export function Grid({ grid, path, onMove }: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Precompute lookups for faster checks
  const visitedSet = useMemo(() => {
    const s = new Set<string>();
    for (const p of path) s.add(`${p.row}-${p.col}`);
    return s;
  }, [path]);

  const lastPos = useMemo(() => path[path.length - 1] || null, [path]);

  const isVisited = (r: number, c: number) => visitedSet.has(`${r}-${c}`);
  const isLast = (r: number, c: number) =>
    !!(lastPos && lastPos.row === r && lastPos.col === c);

  // Handle touch moving across elements
  // React's onPointerEnter works for mouse, but for Touch, the target is fixed to the start element.
  // We need `touchmove` global handler or `document.elementFromPoint`.
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
      className="relative select-none touch-none bg-white p-2 sm:p-3 md:p-4 rounded-3xl border border-orange-200"
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
          <CellComp
            key={`${r}-${c}`}
            cell={cell}
            isActive={isLast(r, c)}
            isVisited={isVisited(r, c)}
            onPointerEnter={() => onMove({ row: r, col: c })}
            onPointerDown={() => onMove({ row: r, col: c })}
          />
        ))
      )}

      {/* Animated SVG Path Overlay */}
      {path.length > 1 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          viewBox={`0 0 100 ${(100 * rows) / cols}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "24px",
          }}
        >
          <defs>
            <filter id="path-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient
              id="pathGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#f97316", stopOpacity: 0.9 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#fb923c", stopOpacity: 0.9 }}
              />
            </linearGradient>
          </defs>
          <motion.path
            d={getPathString(path, rows, cols)}
            stroke="url(#pathGradient)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#path-glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </svg>
      )}
    </div>
  );
}

// Logic to convert grid path to SVG path coordinates
// Assuming grid is perfectly uniform.
// We use percentages: center of cell (r,c) is at:
// x = (c + 0.5) * (100/cols)%
// y = (r + 0.5) * (100/rows)%
// But SVG needs units or viewBox.
// Let's use viewBox="0 0 100 100" * aspect ratio?
// Simpler: Just map to percentage strings in 'd'.
function getPathString(path: Position[], rows: number, cols: number): string {
  if (path.length === 0) return "";

  const getX = (c: number) => ((c + 0.5) / cols) * 100;
  const getY = (r: number) => ((r + 0.5) / rows) * 100;

  let d = `M ${getX(path[0].col)} ${getY(path[0].row)}`;
  for (let i = 1; i < path.length; i++) {
    d += ` L ${getX(path[i].col)} ${getY(path[i].row)}`;
  }
  return d;
}
