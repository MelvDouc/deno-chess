import { Colors, Wings } from "./constants.ts";
import Coordinates from "./Coordinates.ts";
import Piece from "./Piece.ts";

// Keeps tracks of the pieces on the board.
export default class PieceMap extends Map<Coordinates, Piece> {
  /**
   * Convert the piece portion of an FEN string to an instance of this class.
   */
  static fromPieceString(pieceString: string): PieceMap {
    return pieceString
      .split("/")
      .reduce((acc, row, x) => {
        row
          .replace(/\d/g, num => emptySquare.repeat(+num))
          .split("")
          .forEach((char, y) => {
            if (char !== emptySquare)
              acc.set(Coordinates.get(x, y)!, Piece.fromInitial(char));
          });
        return acc;
      }, new PieceMap());
  }

  kings: { [key in Colors]: Piece };

  constructor(entries?: [Coordinates, Piece][]) {
    super(entries);
    this.kings = {} as { [key in Colors]: Piece };
  }

  set(coords: Coordinates, piece: Piece): this {
    if (piece.isKing())
      this.kings[piece.color] = piece;
    piece.coords = coords;
    return super.set(coords, piece);
  }

  getAttackedCoordsSet(color: Colors): Set<Coordinates> {
    const attackedCoordsSet = new Set<Coordinates>();

    for (const piece of this.values())
      if (piece.color === color)
        for (const coords of this.coordsAttackedByPiece(piece))
          attackedCoordsSet.add(coords);

    return attackedCoordsSet;
  }

  /**
   * Determines whether a piece attacks given coordinates.
   * Useful to assess whether a position is check.
   */
  doesPieceAttack(piece: Piece, targetCoords: Coordinates): boolean {
    const xDiff = Math.abs(targetCoords.x - piece.coords.x),
      yDiff = Math.abs(targetCoords.y - piece.coords.y);

    if (piece.isPawn())
      return targetCoords.x - piece.coords.x === piece.direction && yDiff === 1;

    if (piece.isKnight())
      return xDiff * yDiff === 2;

    if (piece.isKing())
      return xDiff <= 1 && yDiff <= 1;

    for (const coords of this.coordsAttackedByPiece(piece))
      if (coords === targetCoords)
        return true;

    return false;
  }

  canCastleToWing(
    wing: Wings,
    kingCoords: Coordinates,
    attackedCoordsSet: Set<Coordinates>
  ): boolean {
    for (let y = kingCoords.y + wing; y !== Piece.initialRookFiles[wing]; y += wing) {
      const peer = Coordinates.get(kingCoords.x, y)!;
      if (this.has(peer))
        return false;
      if (y !== 1 && attackedCoordsSet.has(peer))
        return false;
    }

    return true;
  }

  /**
   * Used when converting a position to an FEN string.
   */
  toString(): string {
    return Array
      .from({ length: 8 }, (_, x) => {
        return Array
          .from({ length: 8 }, (_, y) => this.get(Coordinates.get(x, y)!)?.initial ?? emptySquare)
          .join("")
          .replace(/1+/g, ones => String(ones.length));
      })
      .join("/");
  }

  *forwardPawnMoves(pawn: Piece): CoordsGenerator {
    const { direction } = pawn;
    const squareCoords1 = pawn.coords.getPeer(direction, 0)!;

    if (!this.has(squareCoords1)) {
      yield squareCoords1;

      if (pawn.isOnInitialRank()) {
        const squareCoords2 = pawn.coords.getPeer(direction * 2, 0)!;
        if (!this.has(squareCoords2))
          yield squareCoords2;
      }
    }
  }

  *castlingMoves(king: Piece, castlingRights: CastlingRights): CoordsGenerator {
    const attackedCoordsSet = this.getAttackedCoordsSet(~king.color);

    for (const wing of [Wings.QUEEN_SIDE, Wings.KING_SIDE])
      if (
        castlingRights[king.color][wing]
        && this.canCastleToWing(wing, king.coords, attackedCoordsSet)
      )
        yield king.coords.getPeer(0, wing * 2)!;
  }

  /**
   * Excludes forward pawn moves and castling moves as they can't be captures.
   */
  *coordsAttackedByPiece(piece: Piece): CoordsGenerator {
    if (piece.isPawn() || piece.isKing() || piece.isKnight())
      return yield* shortRangePeers(piece);

    yield* this.longRangePeers(piece);
  }

  /**
   * Get the indices a piece could move to ignoring whether it would cause or resolve a check.
   */
  *pseudoLegalMoves(piece: Piece, enPassantCoords: Coordinates | null): CoordsGenerator {
    if (piece.isPawn()) {
      yield* this.forwardPawnMoves(piece);

      for (const coords of this.coordsAttackedByPiece(piece))
        if (this.get(coords)?.color === ~piece.color || coords === enPassantCoords)
          yield coords;

      return;
    }

    for (const coords of this.coordsAttackedByPiece(piece))
      if (this.get(coords)?.color !== piece.color)
        yield coords;
  }

  /**
   * Find the indices attacked by a long range piece.
   */
  *longRangePeers(piece: Piece): CoordsGenerator {
    const { x: xOffsets, y: yOffsets } = piece.offsets;

    for (let i = 0; i < xOffsets.length; i++) {
      for (const peer of piece.coords.getPeers(xOffsets[i], yOffsets[i])) {
        yield peer;
        if (this.has(peer))
          break;
      }
    }
  }
}


const emptySquare = "1";

/**
 * Find the indices attacked by a short range piece.
 */
function* shortRangePeers(piece: Piece): CoordsGenerator {
  const { x: xOffsets, y: yOffsets } = piece.offsets;

  for (let i = 0; i < xOffsets.length; i++) {
    const peer = piece.coords.getPeer(xOffsets[i], yOffsets[i]);
    if (peer)
      yield peer;
  }
}