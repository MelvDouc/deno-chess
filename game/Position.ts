import { Colors, Wings } from "./constants.ts";
import Coordinates, { c } from "./Coordinates.ts";
import PieceMap from "./PieceMap.ts";

export default class Position {
  static readonly startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w kqKQ - 0 1";

  readonly pieceMap: PieceMap;
  readonly castlingRights: CastlingRights;
  colorToMove: Colors;
  enPassantCoords: Coordinates | null;
  halfMoveClock: number;
  fullMoveNumber: number;
  prev: Position | null = null;
  next: Position | null = null;
  variations: Position[] = [];

  constructor(fenString: string) {
    const [
      pieceString,
      colorChar,
      castlingString,
      enPassantSquare,
      halfMoveClock,
      fullMoveNumber
    ] = fenString.split(" ");

    this.pieceMap = PieceMap.fromPieceString(pieceString);
    this.colorToMove = (colorChar === "w") ? Colors.WHITE : Colors.BLACK;
    this.castlingRights = castlingStringToObject(castlingString);
    this.enPassantCoords = Coordinates.fromNotation(enPassantSquare);
    this.halfMoveClock = +halfMoveClock;
    this.fullMoveNumber = +fullMoveNumber;
  }

  get fenString(): string {
    return [
      this.pieceMap.toString(),
      (this.colorToMove === Colors.WHITE) ? "w" : "b",
      castlingRightsToString(this.castlingRights),
      this.enPassantCoords?.notation ?? "-",
      String(this.halfMoveClock),
      String(this.fullMoveNumber)
    ].join(" ");
  }

  // Get all legal moves.
  getMoves() {
    const moves = [];
    // The move-testing methods will cause `for (const [srcIndex, piece] of this.pieceMap)`
    // to become an infinite loop.
    const entries = [...this.pieceMap];

    for (const [srcCoords, piece] of entries) {
      if (piece.color !== this.colorToMove)
        continue;

      for (const destCoords of this.pieceMap.pseudoLegalMoves(piece, this.enPassantCoords)) {
        // Testing the move for check and undoing it.
        const undoInfo = this.startMove(srcCoords, destCoords);
        if (!this.isCheck()) {
          moves.push({ srcCoords, destCoords });
        }
        this.undoMove(undoInfo);
      }
    }

    if (!this.isCheck()) {
      const kingCoords = this.pieceMap.kingCoords[this.colorToMove];
      for (const destCoords of this.pieceMap.castlingMoves(this.pieceMap.get(kingCoords)!, this.castlingRights)) {
        moves.push({ srcCoords: kingCoords, destCoords });
      }
    }

    return moves;
  }

  isCheck(): boolean {
    return this.pieceMap.getAttackedCoords(~this.colorToMove).has(this.pieceMap.kingCoords[this.colorToMove]);
  }

  isTripleRepetition(): boolean {
    if (!this.prev)
      return false;

    const trimMoveNumbersRegex = / \d+ \d+$/;
    const fenString = this.fenString.replace(trimMoveNumbersRegex, "");
    let count = 0;

    // Skipping previous positions with a different color to move.
    for (let current = this.prev.prev; current; current = current.prev?.prev ?? null) {
      if (current.fenString.replace(trimMoveNumbersRegex, "") === fenString)
        count++;
      if (count === 3)
        return true;
    }

    return false;
  }

  // Move a piece to its destination square and return which pieces were moves
  // so the move can be undone.
  startMove(srcCoords: Coordinates, destCoords: Coordinates): [Coordinates, Piece | null][] {
    const srcPiece = this.pieceMap.get(srcCoords)!,
      destPiece = this.pieceMap.get(destCoords) ?? null;
    const undoInfo: [Coordinates, Piece | null][] = [
      [srcCoords, srcPiece],
      [destCoords, destPiece]
    ];

    this.pieceMap.set(destCoords, srcPiece);
    this.pieceMap.delete(srcCoords);

    if (srcPiece.isPawn() && destCoords === this.enPassantCoords) {
      const enPassantCoords = destCoords.getPeer({ xOffset: 0, yOffset: -srcPiece.direction })!,
        enPassantPawn = this.pieceMap.get(enPassantCoords)!;
      undoInfo.push([enPassantCoords, enPassantPawn]);
      this.pieceMap.delete(enPassantCoords);
    }

    return undoInfo;
  }

  undoMove(undoInfo: [Coordinates, Piece | null][]): void {
    for (const [coords, piece] of undoInfo) {
      if (piece)
        this.pieceMap.set(coords, piece);
      else
        this.pieceMap.delete(coords);
    }
  }

  clone(): Position {
    return new Position(this.fenString);
  }

  log(): void {
    for (let x = 0; x < 8; x++) {
      const row = [];
      for (let y = 0; y < 8; y++) {
        row.push(this.pieceMap.get(c({ x, y })!)?.initial ?? "-");
      }
      console.log(row.join(" "));
    }
  }
}

// ===== ===== ===== ===== =====
// Castling
// ===== ===== ===== ===== =====

const whiteKS = "K",
  whiteQS = "Q",
  blackKS = "k",
  blackQS = "q";

function castlingStringToObject(castlingString: string): CastlingRights {
  return {
    [Colors.WHITE]: {
      [Wings.QUEEN_SIDE]: castlingString.includes(whiteQS),
      [Wings.KING_SIDE]: castlingString.includes(whiteKS)
    },
    [Colors.BLACK]: {
      [Wings.QUEEN_SIDE]: castlingString.includes(blackQS),
      [Wings.KING_SIDE]: castlingString.includes(blackKS)
    }
  };
}

function castlingRightsToString(castlingRights: CastlingRights): string {
  let castlingString = "";

  if (castlingRights[Colors.BLACK][Wings.KING_SIDE])
    castlingString += blackKS;
  if (castlingRights[Colors.BLACK][Wings.QUEEN_SIDE])
    castlingString += blackQS;
  if (castlingRights[Colors.WHITE][Wings.KING_SIDE])
    castlingString += whiteKS;
  if (castlingRights[Colors.WHITE][Wings.QUEEN_SIDE])
    castlingString += whiteQS;

  return castlingString.length ? castlingString : "-";
}