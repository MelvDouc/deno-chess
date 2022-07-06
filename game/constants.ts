export enum Colors {
  WHITE,
  BLACK = ~WHITE
}

export enum Wings {
  QUEEN_SIDE = -1,
  KING_SIDE = 1
}

export enum PieceTypes {
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING
}

export const GameStatuses = Object.freeze({
  ACTIVE: "active",
  CHECKMATE: "checkmate",
  STALEMATE: "stalemate",
  DRAW_BY_TRIPLE_REPETITION: "draw by triple repetition",
  DRAW_BY_FIFTY_MOVE_RULE: "draw by fifty-move rule"
});

export const pieceTypesByInitial: Record<string, PieceTypes> = {
  p: PieceTypes.PAWN,
  n: PieceTypes.KNIGHT,
  b: PieceTypes.BISHOP,
  r: PieceTypes.ROOK,
  q: PieceTypes.QUEEN,
  k: PieceTypes.KING
};

export const initialsByPieceColorAndType = {
  [Colors.WHITE]: {
    [PieceTypes.PAWN]: "P",
    [PieceTypes.KNIGHT]: "N",
    [PieceTypes.BISHOP]: "B",
    [PieceTypes.ROOK]: "R",
    [PieceTypes.QUEEN]: "Q",
    [PieceTypes.KING]: "K"
  },
  [Colors.BLACK]: {
    [PieceTypes.PAWN]: "p",
    [PieceTypes.KNIGHT]: "n",
    [PieceTypes.BISHOP]: "b",
    [PieceTypes.ROOK]: "r",
    [PieceTypes.QUEEN]: "q",
    [PieceTypes.KING]: "k"
  }
};

const rookOffsets = {
  x: [-1, 0, 0, 1],
  y: [0, -1, 1, 0]
};

const bishopOffsets = {
  x: [-1, -1, 1, 1],
  y: [-1, 1, -1, 1]
};

const adjacentOffsets = {
  x: rookOffsets.x.concat(bishopOffsets.x),
  y: rookOffsets.y.concat(bishopOffsets.y)
};

export const figureOffsets = {
  [PieceTypes.KNIGHT]: {
    x: [-2, -2, -1, -1, 1, 1, 2, 2],
    y: [-1, 1, -2, 2, -2, 2, -1, 1]
  },
  [PieceTypes.BISHOP]: bishopOffsets,
  [PieceTypes.ROOK]: rookOffsets,
  [PieceTypes.QUEEN]: adjacentOffsets,
  [PieceTypes.KING]: adjacentOffsets
};