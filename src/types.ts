// PuzzleState
export type PuzzleState = "PLAYING" | "CHECK_RESULT" | "DONE";

export enum TargetColor {
  WHITE = "WHITE",
  BLACK = "BLACK",
  BOTH = "BOTH",
}

// Stats for each mode
export interface Stats {
  times: number[];
  correctCount: number;
  incorrectCount: number;
}

// Each game mode
export interface Mode {
  sideToMove: "w" | "b";
  orientation: "white" | "black";
  targetColor: TargetColor;
  description: string;
}
