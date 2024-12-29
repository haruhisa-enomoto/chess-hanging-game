import { Mode, TargetColor } from "./types";

export const MODES: Mode[] = [
  {
    sideToMove: "w",
    orientation: "white",
    targetColor: TargetColor.BLACK,
    description: "Black (white-view)"
  },
  {
    sideToMove: "b",
    orientation: "black",
    targetColor: TargetColor.WHITE,
    description: "White (black-view)"
  },
  {
    sideToMove: "b",
    orientation: "white",
    targetColor: TargetColor.WHITE,
    description: "White (white-view)"
  },
  {
    sideToMove: "w",
    orientation: "black",
    targetColor: TargetColor.BLACK,
    description: "Black (black-view)"
  },
  {
    sideToMove: "w",
    orientation: "white",
    targetColor: TargetColor.BOTH,
    description: "Both (white-view)"
  },
  {
    sideToMove: "b",
    orientation: "black",
    targetColor: TargetColor.BOTH,
    description: "Both (black-view)"
  },
];
