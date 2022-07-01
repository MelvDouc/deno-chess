interface Coordinates {
  x: number;
  y: number;
}

interface Move {
  srcIndex: number;
  destIndex: number;
  promotionType?: PromotionType;
}

interface PieceOffsets {
  x: number[];
  y: number[];
}

interface PositionConfig {
  pieceMap: import("./PieceMap.ts").default;
  colorToMove: Colors;
  castlingRights: CastlingRights;
  enPassantIndex: number;
  halfMoveClock: number;
  fullMoveNumber: number;
}

type CastlingRights = {
  [key in Colors]: {
    [key in Wings]: boolean;
  }
};

type UndoInfo = Record<number, Piece | null>;

type Colors = import("./constants.ts").Colors;
type Wings = import("./constants.ts").Wings;
type Piece = import("./Piece.ts").default;
type PromotionType = "Q" | "R" | "B" | "N";
type IndexGenerator = Generator<number, void, unknown>;
type KingIndices = { [key in Colors]: number };