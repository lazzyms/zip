"use client";
import React from "react";
import { clsx } from "clsx";

interface NodeProps {
  num: number;
  isVisited: boolean;
}

export function Node({ num, isVisited }: NodeProps) {
  return (
    <div
      className={clsx(
        "z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-lg pointer-events-none transition-all duration-300",
        isVisited ? "scale-125 text-blue-600" : "scale-100 text-neutral-800"
      )}
    >
      <span className="font-black text-lg">{num}</span>
    </div>
  );
}
