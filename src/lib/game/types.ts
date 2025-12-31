export type Direction = "N" | "S" | "E" | "W";

export interface Walls {
  N: boolean;
  S: boolean;
  E: boolean;
  W: boolean;
}

export interface Cell {
  row: number;
  col: number;
  num: number; // 0 if empty, >0 if a sequence marker
  walls: Walls; // Internal walls for path validation (always present)
  visibleWalls: Walls; // Walls to display to user (only for hard difficulty)
}

export type Grid = Cell[][];

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  grid: Grid;
  path: Position[];
  size: { rows: number; cols: number };
  maxNum: number;
  status: "playing" | "won" | "lost";
}
