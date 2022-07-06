interface HalfMove {
  srcCoords: Coordinates;
  destCoords: Coordinates;
  promotionType?: PromotionType;
}

interface PieceOffsets {
  x: number[];
  y: number[];
}

type CastlingRights = {
  [key in Colors]: {
    [key in Wings]: boolean;
  }
};

type Coordinates = import("./Coordinates.ts").default;
type Colors = import("./constants.ts").Colors;
type Wings = import("./constants.ts").Wings;
type Piece = import("./Piece.ts").default;
type PromotionType = "Q" | "R" | "B" | "N";
type CoordsGenerator = Generator<Coordinates, void, unknown>;
type KingCoords = { [key in Colors]: Coordinates };