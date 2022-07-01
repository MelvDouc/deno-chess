import { Colors, Wings } from "./constants.ts";
import { coordsToIndex, indexToCoords } from "./coords.ts";
import Piece from "./Piece.ts";

// Keeps tracks of the pieces on the board.
export default class PieceMap extends Map<number, Piece> {
  // Convert the piece portion of an FEN string to an instance of this class.
  static fromPieceString(pieceString: string): PieceMap {
    return pieceString
      .split("/")
      .reduce((acc, row, x) => {
        row
          .replace(/\d/g, num => emptySquare.repeat(+num))
          .split("")
          .forEach((char, y) => {
            if (char !== emptySquare)
              acc.set(coordsToIndex({ x, y }), Piece.fromInitial(char));
          });
        return acc;
      }, new PieceMap());
  }

  static indexToCoords = indexToCoords;

  // Keep track of where each king is placed to more easily to determine whether a position is check.
  kingIndices: KingIndices;

  constructor(entries?: [number, Piece][]) {
    super(entries);
    this.kingIndices = {
      [Colors.WHITE]: -1,
      [Colors.BLACK]: -1
    };
  }

  set(index: number, piece: Piece) {
    if (piece.isKing())
      this.kingIndices[piece.color] = index;
    piece.index = index;
    return super.set(index, piece);
  }

  // Determine whether a piece attacks a given index.
  // Useful to determine if a position is check.
  doesPieceAttack(piece: Piece, targetIndex: number): boolean {
    const pieceCoords = indexToCoords(piece.index),
      squareCoords = indexToCoords(targetIndex);
    const xDiff = Math.abs(squareCoords.x - pieceCoords.x),
      yDiff = Math.abs(squareCoords.y - pieceCoords.y);

    if (piece.isPawn())
      return squareCoords.x - pieceCoords.x === piece.direction && yDiff === 1;

    if (piece.isKnight())
      return xDiff * yDiff === 2;

    if (piece.isKing())
      return xDiff === 1 && [0, 1].includes(yDiff)
        || xDiff === 0 && yDiff === 1;

    for (const j of this.indicesAttackedByPiece(piece))
      if (j === targetIndex)
        return true;

    return false;
  }

  canCastleToWing(wing: Wings, index: number, color: Colors, castlingRights: CastlingRights): boolean {
    if (!castlingRights[color][wing])
      return false;

    for (let j = index + wing; j !== Piece.initialRookIndices[color][wing]; j += wing)
      if (this.has(j))
        return false;

    for (let j = index + wing; ; j += wing) {
      for (const piece of this.values())
        if (piece.color === ~color && this.doesPieceAttack(piece, j))
          return false;
      if (j === Piece.castledKingIndices[color][wing])
        break;
    }

    return true;
  }

  // Used when converting a position to an FEN string.
  toString(): string {
    return Array
      .from({ length: 8 }, (_, x) => {
        return Array
          .from({ length: 8 }, (_, y) => this.get(coordsToIndex({ x, y }))?.initial ?? emptySquare)
          .join("")
          .replace(/1+/g, ones => String(ones.length));
      })
      .join("/");
  }

  *forwardPawnMoves(pawn: Piece): IndexGenerator {
    const { index, direction } = pawn;
    const squareIndex1 = index + 8 * direction;

    if (!this.has(squareIndex1)) {
      yield squareIndex1;

      if (pawn.isOnInitialRank()) {
        const squareIndex2 = index + 8 * direction * 2;
        if (!this.has(squareIndex2))
          yield squareIndex2;
      }
    }
  }

  *castlingMoves(king: Piece, castlingRights: CastlingRights): IndexGenerator {
    for (const wing of [Wings.QUEEN_SIDE, Wings.KING_SIDE])
      if (this.canCastleToWing(wing, king.index, king.color, castlingRights))
        yield Piece.castledKingIndices[king.color][wing];
  }

  // Excludes forward pawn moves and castling moves as they can't be captures.
  *indicesAttackedByPiece(piece: Piece): IndexGenerator {
    if (piece.isPawn() || piece.isKing() || piece.isKnight())
      return yield* shortRangePeers(piece);

    yield* this.longRangePeers(piece);
  }

  // Get the indices a piece could move to ignoring whether it would cause or resolve a check.
  *pseudoLegalMoves(piece: Piece, enPassantIndex: number): IndexGenerator {
    if (piece.isPawn()) {
      yield* this.forwardPawnMoves(piece);

      for (const j of this.indicesAttackedByPiece(piece))
        if (this.get(j)?.color === ~piece.color || j === enPassantIndex)
          yield j;

      return;
    }

    for (const j of this.indicesAttackedByPiece(piece))
      if (this.get(j)?.color !== piece.color)
        yield j;
  }

  // Find the indices attacked by a long range piece.
  *longRangePeers(piece: Piece): IndexGenerator {
    const { x: xOffsets, y: yOffsets } = piece.offsets;
    const coords = indexToCoords(piece.index);

    for (let i = 0; i < xOffsets.length; i++) {
      const xOffset = xOffsets[i];
      const yOffset = yOffsets[i];
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

// Find the indices attacked by a short range piece.
function* shortRangePeers(piece: Piece): IndexGenerator {
  const { x: xOffsets, y: yOffsets } = piece.offsets;
  const coords = indexToCoords(piece.index);

  for (let i = 0; i < xOffsets.length; i++) {
    const x = coords.x + xOffsets[i];
    const y = coords.y + yOffsets[i];
    if (isInBounds(x) && isInBounds(y))
      yield coordsToIndex({ x, y });
  }
}

function isInBounds(n: number): boolean {
  return n >= 0 && n < 8;
}

// function areSameRankOrFile(coords1: Coordinates, coords2: Coordinates): boolean {
//   return coords1.x === coords2.x || coords1.y === coords2.y;
// }

// function areSameDiagonal(coords1: Coordinates, coords2: Coordinates): boolean {
//   return coords1.x + coords1.y === coords2.x + coords2.y
//     || coords1.x - coords1.y === coords2.x - coords2.y;
// }