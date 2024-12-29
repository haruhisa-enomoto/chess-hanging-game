import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Chess, Square } from "chess.js";
import React from "react";
import { Chessboard } from "react-chessboard";
import { useNavigate, useParams } from "react-router";
import { MODES } from "./constants";
import type { Mode, PuzzleState, Stats } from "./types";

/* --------------------------------------------------------
   PuzzlePage
-------------------------------------------------------- */

export default function PuzzlePage(): JSX.Element {
  const { modeIndex } = useParams();
  const navigate = useNavigate();

  // Convert modeIndex from string to number
  const index = modeIndex ? parseInt(modeIndex, 10) : 0;
  const currentMode: Mode = MODES[index];

  // Stats: key = modeIndex
  const [modeStats, setModeStats] = React.useState<Record<number, Stats>>({});

  // Chess instance and board state
  const [chess, setChess] = React.useState<Chess>(new Chess());
  const [fen, setFen] = React.useState<string>(chess.fen());

  // Correct squares
  const [correctSquares, setCorrectSquares] = React.useState<Square[]>([]);
  // User-selected squares
  const [userSquares, setUserSquares] = React.useState<Square[]>([]);
  // Missing/Extra squares
  const [missingSquares, setMissingSquares] = React.useState<Square[]>([]);
  const [extraSquares, setExtraSquares] = React.useState<Square[]>([]);

  // Puzzle state
  const [puzzleState, setPuzzleState] = React.useState<PuzzleState>("PLAYING");

  // Time tracking
  const [puzzleStart, setPuzzleStart] = React.useState<number>(0);
  const [puzzleTime, setPuzzleTime] = React.useState<number>(0);
  const intervalRef = React.useRef<NodeJS.Timer | number | null>(null);

  React.useEffect(() => {
    startPuzzle(index);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as number);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  React.useEffect(() => {
    if (puzzleState === "PLAYING") {
      intervalRef.current = setInterval(() => {
        setPuzzleTime((performance.now() - puzzleStart) / 1000);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as number);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as number);
      }
    };
  }, [puzzleState, puzzleStart]);

  function startPuzzle(idx: number): void {
    // Initialize stats if needed
    const newStats = { ...modeStats };
    if (!newStats[idx]) {
      newStats[idx] = { times: [], correctCount: 0, incorrectCount: 0 };
    }

    const newChess = new Chess();
    createRandomPosition(newChess, MODES[idx].sideToMove);

    // Generate hanging squares (must have at least 1)
    let squares = getHangingSquares(newChess, MODES[idx].targetColor);
    while (squares.length === 0) {
      newChess.reset();
      createRandomPosition(newChess, MODES[idx].sideToMove);
      squares = getHangingSquares(newChess, MODES[idx].targetColor);
    }

    setModeStats(newStats);
    setChess(newChess);
    setFen(newChess.fen());
    setCorrectSquares(squares);
    setUserSquares([]);
    setMissingSquares([]);
    setExtraSquares([]);
    setPuzzleState("PLAYING");
    setPuzzleStart(performance.now());
    setPuzzleTime(0);
  }

  function createRandomPosition(chs: Chess, side: "w" | "b"): void {
    const halfmoves = 20 + Math.floor(Math.random() * 41);
    for (let i = 0; i < halfmoves; i++) {
      if (chs.isGameOver()) chs.undo();
      const moves = chs.moves();
      if (!moves.length) break;
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      chs.move(randomMove);
    }
    // Adjust turn
    if (chs.turn() !== side && !chs.isGameOver()) {
      const moves = chs.moves();
      if (moves.length) {
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        chs.move(randomMove);
      }
    }
  }

  // Click on square toggles selection
  function onSquareClick(square: Square): void {
    if (puzzleState !== "PLAYING") return;
    if (userSquares.includes(square)) {
      setUserSquares(userSquares.filter((s) => s !== square));
    } else {
      setUserSquares([...userSquares, square]);
    }
  }

  function handleCheckClick(): void {
    if (puzzleState === "PLAYING") {
      judgePuzzle();
    } else {
      // If we're at CHECK_RESULT or DONE, start a new puzzle
      startPuzzle(index);
    }
  }

  function judgePuzzle(): void {
    setPuzzleState("CHECK_RESULT");
    const missing = correctSquares.filter((sq) => !userSquares.includes(sq));
    const extra = userSquares.filter((sq) => !correctSquares.includes(sq));
    setMissingSquares(missing);
    setExtraSquares(extra);

    const s = modeStats[index];
    if (missing.length === 0 && extra.length === 0) {
      // Perfect
      setPuzzleState("DONE");
      s.correctCount += 1;
      s.times.push(puzzleTime);
    } else {
      // Incorrect
      s.incorrectCount += 1;
    }
    setModeStats({ ...modeStats });
  }

  function forceFenSideToMove(originalFen: string, color: "w" | "b"): string {
    const parts = originalFen.split(" ");
    // parts[0] = board
    // parts[1] = sideToMove
    // parts[2] = castling
    // parts[3] = enPassant
    // parts[4] = halfMoveClock
    // parts[5] = fullMoveNumber

    parts[1] = color; // Force the side to move
    return parts.join(" ");
  }

  function getHangingSquares(chs: Chess, color: Mode["targetColor"]): Square[] {
    if (color === "WHITE") {
      return findHangingPieces(chs, "w");
    } else if (color === "BLACK") {
      return findHangingPieces(chs, "b");
    } else {
      // BOTH
      const w = findHangingPieces(chs, "w");
      const b = findHangingPieces(chs, "b");
      const combined = new Set([...w, ...b]);
      return [...combined].sort();
    }
  }

  function findHangingPieces(chs: Chess, c: "w" | "b"): Square[] {
    const squares: Square[] = [];
    const boardArr = chs.board();
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = boardArr[rank][file];
        if (!piece) continue;
        if (piece.color === c) {
          const sq = rfToSquare(file, rank);
          if (isReallyHanging(chs, sq)) {
            squares.push(sq);
          }
        }
      }
    }
    return squares;
  }

  function rfToSquare(file: number, rank: number): Square {
    const fileChar = "abcdefgh"[file];
    const rankChar = String(8 - rank);
    return (fileChar + rankChar) as Square;
  }

  /**
   * Return true if the piece on `sq` is attacked by the opponent
   * and cannot be recaptured by the same color.
   *
   * NOTE: We must check the opponent's moves, even if it's not
   * currently that color's turn.
   */
  function isReallyHanging(chs: Chess, sq: Square): boolean {
    const piece = chs.get(sq);
    if (!piece) return false;

    const myColor = piece.color; // "w" or "b"
    const oppColor = myColor === "w" ? "b" : "w";

    // If the opponent does NOT attack this square at all, it's not hanging
    if (!isAttackedBy(chs, sq, oppColor)) {
      return false;
    }

    // If the opponent can capture `sq` and we can't recapture afterwards, it's truly hanging
    const oppMoves = getMovesForColor(chs, oppColor); // Force-generate opp's moves
    for (const mv of oppMoves) {
      if (mv.to === sq) {
        // Simulate opponent capturing
        const forcedFen = forceFenSideToMove(chs.fen(), oppColor);
        const chsCopy = new Chess(forcedFen);
        chsCopy.move(mv);
        // If we can't recapture, it's hanging
        if (!canRecapture(chsCopy, sq, myColor)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Return true if there's at least one move for `color` that captures
   * back on `sq`.
   */
  function canRecapture(chs: Chess, sq: Square, color: "w" | "b"): boolean {
    const myMoves = getMovesForColor(chs, color);
    return myMoves.some((m) => m.to === sq);
  }

  /**
   * Return true if the opponent color can move to `sq` with some move.
   */
  function isAttackedBy(chs: Chess, sq: Square, color: "w" | "b"): boolean {
    const oppMoves = getMovesForColor(chs, color);
    return oppMoves.some((m) => m.to === sq);
  }

  /**
   * Force-generate moves for `color` by temporarily setting the side-to-move
   * to that color. This is necessary because chess.js by default only
   * generates moves for the current turn in `chs`.
   */
  function getMovesForColor(chs: Chess, color: "w" | "b") {
    const forcedFen = forceFenSideToMove(chs.fen(), color);
    const tempChess = new Chess(forcedFen);
    return tempChess.moves({ verbose: true });
  }

  const customSquareStyles = React.useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    for (const sq of missingSquares) {
      styles[sq] = { backgroundColor: "rgba(255, 0, 0, 0.4)" };
    }
    for (const sq of extraSquares) {
      styles[sq] = { backgroundColor: "rgba(255, 165, 0, 0.4)" };
    }
    for (const sq of userSquares) {
      if (!styles[sq]) {
        styles[sq] = { backgroundColor: "rgba(0, 255, 0, 0.4)" };
      }
    }
    return styles;
  }, [missingSquares, extraSquares, userSquares]);

  function renderInfoSection(): JSX.Element {
    const s = modeStats[index];
    if (!s) return <></>;

    const { correctCount, incorrectCount, times } = s;
    const total = correctCount + incorrectCount;
    const rate = total > 0 ? (correctCount / total) * 100 : 0;
    const avgTime =
      times.length > 0
        ? times.reduce((acc, val) => acc + val, 0) / times.length
        : 0;

    let msg = "";
    let severity: "error" | "success" | "info" = "info";
    switch (puzzleState) {
      case "PLAYING":
        msg = "Pick squares and press OK.";
        severity = "info";
        break;
      case "CHECK_RESULT":
        msg =
          missingSquares.length === 0 && extraSquares.length === 0
            ? "Correct!"
            : "Incorrect!";
        msg += "  Red = Missing, Orange = Extra. Press Continue.";
        severity =
          missingSquares.length === 0 && extraSquares.length === 0
            ? "success"
            : "error";
        break;
      case "DONE":
        msg = "Perfect! Press Continue for the next puzzle.";
        severity = "success";
        break;
    }

    return (
      <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
        <Stack spacing={2}>
          {/* Description */}
          <Typography variant="h6" gutterBottom>
            Find Hanging Pieces of {currentMode.description}
          </Typography>
          {/* Stats */}
          <Stack direction="row" spacing={2}>
            <Typography variant="body1">
              <strong>Time:</strong> {puzzleTime.toFixed(1)}s
            </Typography>
            <Typography variant="body1">
              <strong>Avg:</strong> {avgTime.toFixed(1)}s
            </Typography>
            <Typography variant="body1">
              <strong>Correct:</strong> {correctCount}/{total} (
              {rate.toFixed(1)}%)
            </Typography>
          </Stack>

          {/* Status message */}
          <Alert severity={severity}>{msg}</Alert>

          {/* Buttons */}
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleCheckClick}>
              {puzzleState === "PLAYING" ? "OK" : "Continue"}
            </Button>
            <Button variant="outlined" onClick={() => navigate("/")}>
              Back to Mode Selection
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {renderInfoSection()}
      <Box
        sx={{
          margin: "0 auto",
          width: "480px",
          mb: 2,
        }}
      >
        <Paper elevation={5} sx={{ p: 2 }}>
          <Chessboard
            position={fen}
            boardOrientation={currentMode.orientation}
            arePiecesDraggable={false}
            onSquareClick={onSquareClick}
            customSquareStyles={customSquareStyles}
          />
        </Paper>
      </Box>
    </Box>
  );
}
