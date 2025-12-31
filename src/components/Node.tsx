"use client";
import React from "react";
import { clsx } from "clsx";

interface NodeProps {
  num: number;
  isVisited: boolean;
}

const NodeInner = function NodeInner({ num, isVisited }: NodeProps) {
  return (
    <div
      className={clsx(
        "z-10 flex items-center justify-center w-10 h-10 bg-transparent pointer-events-none transition-all duration-300",
        isVisited ? "scale-125" : "scale-100"
      )}
    >
      <span
        className={clsx(
          "font-black text-2xl",
          isVisited ? "text-white" : "text-gray-300"
        )}
      >
        {num}
      </span>
    </div>
  );
};

export const Node = React.memo(NodeInner);
