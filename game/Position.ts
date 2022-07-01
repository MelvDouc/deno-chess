import { Colors, Wings } from "./constants.ts";
import PieceMap from "./PieceMap.ts";

export default class Position {
  static readonly startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w kqKQ - 0 1";

  static indexToNotation(index: number): string {
    return notations[index] ?? "-";
  }

  static notationToIndex(notation: string): number {
    return notations.indexOf(notation);
  }

  readonly pieceMap: PieceMap;
  readonly castlingRights: CastlingRights;
  colorToMove: Colors;
  enPassantIndex: number;
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
    this.enPassantIndex = Position.notationToIndex(enPassantSquare);
    this.halfMoveClock = +halfMoveClock;
    this.fullMoveNumber = +fullMoveNumber;
  }

  get fenString(): string {
    return [
      this.pieceMap.toString(),
      (this.colorToMove === Colors.WHITE) ? "w" : "b",
      castlingRightsToString(this.castlingRights),
      Position.indexToNotation(this.enPassantIndex),
      String(this.halfMoveClock),
      String(this.fullMoveNumber)
    ].join(" ");
  }

  // Get all legal moves.
  getMoves(): Move[] {
    const moves: Move[] = [];
    // The move-testing methods will cause `for (const [srcIndex, piece] of this.pieceMap)`
    // to become an infinite loop.
    const entries = [...this.pieceMap];

    for (const [srcIndex, piece] of entries) {
      if (piece.color !== this.colorToMove)
        continue;

      for (const destIndex of this.pieceMap.pseudoLegalMoves(piece, this.enPassantIndex)) {
        // Testing the move for check and undoing it.
        const undoInfo = this.startMove(srcIndex, destIndex);
        if (!this.isCheck()) {
          moves.push({ srcIndex, destIndex });
        }
        this.undoMove(undoInfo);
      }
    }

    if (!this.isCheck()) {
      const kingIndex = this.pieceMap.kingIndices[this.colorToMove];
      for (const destIndex of this.pieceMap.castlingMoves(this.pieceMap.get(kingIndex)!, this.castlingRights)) {
        moves.push({ srcIndex: kingIndex, destIndex });
      }
    }

    return moves;
  }

  isCheck(): boolean {
    const kingIndex = this.pieceMap.kingIndices[this.colorToMove];

    for (const piece of this.pieceMap.values())
      if (piece.color === ~this.colorToMove && this.pieceMap.doesPieceAttack(piece, kingIndex))
        return true;

    return false;
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
  startMove(srcIndex: number, destIndex: number): UndoInfo {
    const srcPiece = this.pieceMap.get(srcIndex)!,
      destPiece = this.pieceMap.get(destIndex) ?? null;
    const undoInfo = {
      [srcIndex]: srcPiece,
      [destIndex]: destPiece
    };

    this.pieceMap.set(destIndex, srcPiece);
    this.pieceMap.delete(srcIndex);

    if (srcPiece.isPawn() && destIndex === this.enPassantIndex) {
      const enPassantPawnIndex = destIndex - srcPiece.direction * 8,
        enPassantPawn = this.pieceMap.get(enPassantPawnIndex)!;
      undoInfo[enPassantPawnIndex] = enPassantPawn;
      this.pieceMap.delete(enPassantPawnIndex);
    }

    return undoInfo;
  }

  undoMove(undoInfo: UndoInfo): void {
    for (const index in undoInfo) {
      const piece = undoInfo[+index];
      if (piece)
        this.pieceMap.set(+index, piece);
      else
        this.pieceMap.delete(+index);
    }
  }

  clone(): Position {
    return new Position(this.fenString);
  }

  log(): void {
    for (let x = 0; x < 8; x++) {
      const row = [];
      for (let y = 0; y < 8; y++) {
        row.push(this.pieceMap.get(x * 8 + y)?.initial ?? "-");
      }
      console.log(row.join(" "));
    }
  }
}

const notations = Array.from({ length: 8 * 8 }, (_, i) => {
  const { x, y } = PieceMap.indexToCoords(i);
  return String.fromCharCode(y + 97) + String(8 - x);
});

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