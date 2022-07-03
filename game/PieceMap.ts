import { Colors, Wings } from "./constants.ts";
import Coordinates from "./Coordinates.ts";
import Piece from "./Piece.ts";

// Keeps tracks of the pieces on the board.
export default class PieceMap extends Map<Coordinates, Piece> {
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
              acc.set(Coordinates.get(x, y)!, Piece.fromInitial(char));
          });
        return acc;
      }, new PieceMap());
  }

  // Keep track of where each king is placed to more easily to determine whether a position is check.
  kingCoords: KingCoords;

  constructor(entries?: [Coordinates, Piece][]) {
    super(entries);
    this.kingCoords = {} as KingCoords;
  }

  set(coords: Coordinates, piece: Piece) {
    if (piece.isKing())
      this.kingCoords[piece.color] = coords;
    piece.coords = coords;
    return super.set(coords, piece);
  }

  getAttackedCoords(color: Colors): Set<Coordinates> {
    const attackedCoords = new Set<Coordinates>();

    for (const piece of this.values()) {
      if (piece.color !== color)
        continue;
      for (const coords of this.coordsAttackedByPiece(piece))
        attackedCoords.add(coords);
    }

    return attackedCoords;
  }

  // Determine whether a piece attacks a given index.
  // Useful to determine if a position is check.
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
    color: Colors,
    castlingRights: CastlingRights,
    attackedCoordsSet: Set<Coordinates>
  ): boolean {
    if (!castlingRights[color][wing])
      return false;

    for (const peer of kingCoords.getPeers(0, wing)) {
      if (peer.y === Piece.initialRookFiles[wing])
        break;
      if (this.has(peer))
        return false;
    }

    for (const peer of kingCoords.getPeers(0, wing)) {
      if (attackedCoordsSet.has(peer))
        return false;
      if (peer.y === Piece.castledKingFiles[wing])
        break;
    }

    return true;
  }

  // Used when converting a position to an FEN string.
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
    const attackedCoordsSet = this.getAttackedCoords(~king.color);

    for (const wing of [Wings.QUEEN_SIDE, Wings.KING_SIDE])
      if (this.canCastleToWing(wing, king.coords, king.color, castlingRights, attackedCoordsSet))
        yield king.coords.getPeer(0, wing * 2)!;
  }

  // Excludes forward pawn moves and castling moves as they can't be captures.
  *coordsAttackedByPiece(piece: Piece): CoordsGenerator {
    if (piece.isPawn() || piece.isKing() || piece.isKnight())
      return yield* shortRangePeers(piece);

    yield* this.longRangePeers(piece);
  }

  // Get the indices a piece could move to ignoring whether it would cause or resolve a check.
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

  // Find the indices attacked by a long range piece.
  *longRangePeers(piece: Piece) {
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

// Find the indices attacked by a short range piece.
function* shortRangePeers(piece: Piece): CoordsGenerator {
  const { x: xOffsets, y: yOffsets } = piece.offsets;

  for (let i = 0; i < xOffsets.length; i++) {
    const peer = piece.coords.getPeer(xOffsets[i], yOffsets[i]);
    if (peer)
      yield peer;
  }
}