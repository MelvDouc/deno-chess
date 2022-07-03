export enum Colors {
  WHITE,
  BLACK = ~WHITE
}

export enum Wings {
  QUEEN_SIDE = -1,
  KING_SIDE = 1
}

export const GameStatuses = Object.freeze({
  ACTIVE: "active",
  CHECKMATE: "checkmate",
  STALEMATE: "stalemate",
  DRAW_BY_TRIPLE_REPETITION: "draw by triple repition",
  DRAW_BY_FIFTY_MOVE_RULE: "draw by fifty-move rule"
});