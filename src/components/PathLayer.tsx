"use client";
import React, { useMemo } from "react";
import { Position } from "@/lib/game/types";
import { motion } from "framer-motion";

interface PathLayerProps {
  path: Position[];
  rows: number;
  cols: number;
}

const computePathString = (path: Position[], rows: number, cols: number) => {
  if (path.length === 0) return "";

  const getX = (c: number) => ((c + 0.5) / cols) * 100;
  const getY = (r: number) => ((r + 0.5) / rows) * 100;

  let d = `M ${getX(path[0].col)} ${getY(path[0].row)}`;
  for (let i = 1; i < path.length; i++) {
    d += ` L ${getX(path[i].col)} ${getY(path[i].row)}`;
  }
  return d;
};

export const PathLayer = React.memo(function PathLayer({
  path,
  rows,
  cols,
}: PathLayerProps) {
  if (path.length <= 1) return null;

  const d = useMemo(
    () => computePathString(path, rows, cols),
    [path, rows, cols]
  );

  return (
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
        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{ stopColor: "#3b82f6", stopOpacity: 0.9 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "#60a5fa", stopOpacity: 0.9 }}
          />
        </linearGradient>
      </defs>
      <motion.path
        d={d}
        stroke="url(#pathGradient)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0 }}
      />
    </svg>
  );
});
