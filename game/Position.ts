import { Colors, Wings } from "./constants.ts";
import Coordinates from "./Coordinates.ts";
import Piece from "./Piece.ts";
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
  nextPositions: Position[] = [];
  #moves!: HalfMove[];

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

  get shortenedFenString(): string {
    return this.fenString.replace(/ \d+ \d+$/, "");
  }

  get moves(): HalfMove[] {
    return this.#moves;
  }

  isCheck(): boolean {
    return this.pieceMap.getAttackedCoords(~this.colorToMove).has(this.pieceMap.kingCoords[this.colorToMove]);
  }

  isTripleRepetition(): boolean {
    if (!this.prev)
      return false;

    const { shortenedFenString } = this;

    // Skipping previous positions with a different color to move.
    for (let current = this.prev.prev, count = 0; current; current = current.prev?.prev ?? null) {
      if (current.shortenedFenString === shortenedFenString)
        count++;
      if (count === 3)
        return true;
    }

    return false;
  }

  /**
   * Move a piece to its destination square.
   * @returns An array of arrays containing the original coordinates of each piece that was moved or captured and the piece itself. If the move is an en passant capture, the captured pawn and the coordinates it was on are added as well.
   */
  startHalfMove(srcCoords: Coordinates, destCoords: Coordinates): [Coordinates, Piece | null][] {
    const srcPiece = this.pieceMap.get(srcCoords)!,
      destPiece = this.pieceMap.get(destCoords) ?? null;
    const undoInfo: [Coordinates, Piece | null][] = [
      [srcCoords, srcPiece],
      [destCoords, destPiece]
    ];

    this.pieceMap.set(destCoords, srcPiece);
    this.pieceMap.delete(srcCoords);

    if (srcPiece.isPawn() && destCoords === this.enPassantCoords) {
      const enPassantCoords = destCoords.getPeer(-srcPiece.direction, 0)!;
      undoInfo.push([enPassantCoords, this.pieceMap.get(enPassantCoords)!]);
      this.pieceMap.delete(enPassantCoords);
    }

    return undoInfo;
  }

  /**
   * Put every piece back on its old square. Delete it from the square it was moved to as well.
   */
  undoHalfMove(undoInfo: [Coordinates, Piece | null][]): void {
    for (const [coords, piece] of undoInfo) {
      if (piece)
        this.pieceMap.set(coords, piece);
      else
        this.pieceMap.delete(coords);
    }
  }

  /**
   * This is only meant to be used on a clone. The piece on the source square is moved to its destination.
   * All the necessary adjustements resulting from a special move (castling, promotion, etc.) are made.
   * The params of the position are updated so that it represents the position after the half-move was played.
   */
  playHalfMove(move: HalfMove): this {
    const srcPiece = this.pieceMap.get(move.srcCoords)!,
      destPiece = this.pieceMap.get(move.destCoords);
    const isSrcPiecePawn = srcPiece.isPawn(),
      isPawnMoveOrCapture = isSrcPiecePawn || !!destPiece;

    this.startHalfMove(move.srcCoords, move.destCoords);

    // promotion
    if (isSrcPiecePawn && move.destCoords.x === Piece.initialPieceRanks[~srcPiece.color])
      srcPiece.promoteTo(move.promotionType ?? "Q");

    // unset castling rights on king move
    if (srcPiece.isKing()) {
      this.castlingRights[srcPiece.color][Wings.QUEEN_SIDE] = false;
      this.castlingRights[srcPiece.color][Wings.KING_SIDE] = false;

      // move rook on castling
      if (Math.abs(move.destCoords.y - move.srcCoords.y) === 2) {
        const { wing } = srcPiece;
        this.startHalfMove(
          Coordinates.get(move.srcCoords.x, Piece.initialRookFiles[wing])!,
          move.destCoords.getPeer(0, -wing)!
        );
      }
    }

    // unset castling rights on rook move
    if (srcPiece.isRook() && !Piece.hasRookMoved(move.srcCoords, srcPiece.color))
      this.castlingRights[srcPiece.color][srcPiece.wing] = false;

    // unset castling rights on rook capture
    if (destPiece?.isRook() && !Piece.hasRookMoved(move.destCoords, ~srcPiece.color))
      this.castlingRights[destPiece.color][destPiece.wing] = false;

    this.enPassantCoords = isSrcPiecePawn && Math.abs(move.destCoords.x - move.srcCoords.x) === 2
      ? move.srcCoords.getPeer(srcPiece.direction, 0)
      : null;
    this.colorToMove = ~this.colorToMove;
    this.halfMoveClock = isPawnMoveOrCapture ? 0 : this.halfMoveClock + 1;
    this.colorToMove === Colors.WHITE && this.fullMoveNumber++;
    return this;
  }

  clone(): Position {
    return new Position(this.fenString);
  }

  log(): void {
    for (let x = 0; x < 8; x++) {
      const row = [];
      for (let y = 0; y < 8; y++) {
        row.push(this.pieceMap.get(Coordinates.get(x, y)!)?.initial ?? "-");
      }
      console.log(row.join(" "));
    }
  }

  /**
   * The moves aren't defined in the constructor as a move might have to be played first.
   */
  addMoves(): this {
    this.#moves = this.#getMoves();
    return this;
  }

  /**
   * Get all the legal moves in the position.
   * Each move is tested to see if it'd be check after it's made.
   */
  #getMoves() {
    const moves: HalfMove[] = [];
    // The move-testing methods will cause `for (const [srcIndex, piece] of this.pieceMap)`
    // to become an infinite loop.
    const entries = [...this.pieceMap];

    for (const [srcCoords, piece] of entries) {
      if (piece.color !== this.colorToMove)
        continue;

      for (const destCoords of this.pieceMap.pseudoLegalMoves(piece, this.enPassantCoords)) {
        // Testing the move for check and undoing it.
        const undoInfo = this.startHalfMove(srcCoords, destCoords);
        this.isCheck() || moves.push({ srcCoords, destCoords });
        this.undoHalfMove(undoInfo);
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