import { Colors, Wings } from "./constants.ts";
import Piece from "./Piece.ts";

export default class PieceMap extends Map<number, Piece> {
  static fromPieceString(pieceString: string): PieceMap {
    return pieceString
      .split("/")
      .reduce((acc, row, x) => {
        row
          .replace(/\d/g, num => emptySquare.repeat(+num))
          .split("")
          .forEach((char, y) => {
            if (char !== emptySquare)
              acc.set({ x, y }, Piece.fromInitial(char));
          });
        return acc;
      }, new PieceMap());
  }

  static indexToCoords = indexToCoords;

  kingIndices: KingIndices;

  constructor(entries?: [number, Piece][]) {
    super(entries);
    this.kingIndices = {
      [Colors.WHITE]: -1,
      [Colors.BLACK]: -1
    };
  }

  get(indexOrCoords: number | Coordinates) {
    return super.get(typeof indexOrCoords === "object" ? coordsToIndex(indexOrCoords) : indexOrCoords);
  }

  set(indexOrCoords: number | Coordinates, piece: Piece) {
    typeof indexOrCoords === "object" && (indexOrCoords = coordsToIndex(indexOrCoords));
    if (piece.isKing())
      this.kingIndices[piece.color] = indexOrCoords;
    super.set(indexOrCoords, piece);
    return this;
  }

  doesPieceAttack(pieceIndex: number, squareIndex: number): boolean {
    const pieceCoords = indexToCoords(pieceIndex),
      squareCoords = indexToCoords(squareIndex);
    const xDiff = Math.abs(squareCoords.x - pieceCoords.x),
      yDiff = Math.abs(squareCoords.y - pieceCoords.y);
    const piece = this.get(pieceIndex) as Piece;

    if (piece.isPawn())
      return squareCoords.x - pieceCoords.x === piece.direction && yDiff === 1;

    if (piece.isKnight())
      return xDiff * yDiff === 2;

    if (piece.isKing())
      return xDiff === 1 && [0, 1].includes(yDiff)
        || xDiff === 0 && yDiff === 1;

    for (const j of this.indicesAttackedByPiece(pieceIndex, piece))
      if (j === squareIndex)
        return true;

    return false;
  }

  canCastle(index: number, color: Colors, wing: Wings, castlingRights: CastlingRights): boolean {
    if (!castlingRights[color][wing])
      return false;

    for (let j = index + wing; j !== Piece.initialRookIndices[color][wing]; j += wing)
      if (this.has(j))
        return false;

    for (let j = index + wing; ; j += wing) {
      for (const [index, piece] of this)
        if (piece.color === ~color && this.doesPieceAttack(index, j))
          return false;
      if (j === Piece.castledKingIndices[color][wing])
        break;
    }

    return true;
  }

  toString(): string {
    return Array
      .from({ length: 8 }, (_, x) => {
        return Array
          .from({ length: 8 }, (_, y) => this.get({ x, y })?.initial ?? emptySquare)
          .join("")
          .replace(/1+/g, ones => String(ones.length));
      })
      .join("/");
  }

  *forwardPawnMoves(index: number, color: Colors): IndexGenerator {
    const direction = Piece.pawnDirections[color];
    const squareIndex1 = index + 8 * direction;

    if (!this.has(squareIndex1)) {
      yield squareIndex1;

      if (Math.floor(index / 8) === Piece.initialPawnRanks[color]) {
        const squareIndex2 = index + 8 * direction * 2;
        if (!this.has(squareIndex2))
          yield squareIndex2;
      }
    }
  }

  *castlingMoves(index: number, color: Colors, castlingRights: CastlingRights): IndexGenerator {
    for (const wing of [Wings.QUEEN_SIDE, Wings.KING_SIDE])
      if (this.canCastle(index, color, wing, castlingRights))
        yield Piece.castledKingIndices[color][wing];
  }

  *indicesAttackedByPiece(index: number, piece: Piece): IndexGenerator {
    if (piece.isPawn() || piece.isKing() || piece.isKnight()) {
      return yield* shortRangePeers(index, piece.offsets);
    }

    yield* this.longRangePeers(index, piece.offsets);
  }

  *pseudoLegalMoves(index: number, piece: Piece, enPassantIndex: number): IndexGenerator {
    if (piece.isPawn()) {
      yield* this.forwardPawnMoves(index, piece.color);

      for (const j of this.indicesAttackedByPiece(index, piece))
        if (this.get(j)?.color === ~piece.color || j === enPassantIndex)
          yield j;

      return;
    }

    for (const j of this.indicesAttackedByPiece(index, piece))
      if (this.get(j)?.color !== piece.color)
        yield j;
  }

  *longRangePeers(index: number, offsets: PieceOffsets): IndexGenerator {
    const coords = indexToCoords(index);

    for (let i = 0; i < offsets.x.length; i++) {
      const xOffset = offsets.x[i];
      const yOffset = offsets.y[i];
      let { x, y } = coords;

      while (isInBounds(x += xOffset) && isInBounds(y += yOffset)) {
        const j = coordsToIndex({ x, y });
        yield j;
        if (this.has(j))
          break;
      }
    }
  }
}


const emptySquare = "1";

function* shortRangePeers(index: number, offsets: PieceOffsets) {
  const coords = indexToCoords(index);

  for (let i = 0; i < offsets.x.length; i++) {
    const x = coords.x + offsets.x[i];
    const y = coords.y + offsets.y[i];
    if (isInBounds(x) && isInBounds(y))
      yield coordsToIndex({ x, y });
  }
}

function isInBounds(n: number): boolean {
  return n >= 0 && n < 8;
}

function indexToCoords(index: number): Coordinates {
  return {
    x: Math.floor(index / 8),
    y: index % 8
  };
}

function coordsToIndex({ x, y }: Coordinates): number {
  return x * 8 + y;
}


// function areSameRankOrFile(coords1: Coordinates, coords2: Coordinates): boolean {
//   return coords1.x === coords2.x || coords1.y === coords2.y;
// }

// function areSameDiagonal(coords1: Coordinates, coords2: Coordinates): boolean {
//   return coords1.x + coords1.y === coords2.x + coords2.y
//     || coords1.x - coords1.y === coords2.x - coords2.y;
// }