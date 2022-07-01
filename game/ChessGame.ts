import { Colors, Wings } from "./constants.ts";
import Coordinates, { c } from "./Coordinates.ts";
import Piece from "./Piece.ts";
import Position from "./Position.ts";

export default class ChessGame {
  currentPosition: Position;
  status: GameStatuses = GameStatuses.ACTIVE;

  constructor({ fenString = Position.startFen }: { fenString?: string; moves?: string; } = {}) {
    this.currentPosition = new Position(fenString);
    // moves
    this.updateStatus();
  }

  playMove(srcCoords: Coordinates, destCoords: Coordinates, promotionType?: PromotionType): void {
    if (this.status !== GameStatuses.ACTIVE)
      return console.log("Game is inactive.");

    const nextPosition = new Position(this.currentPosition.fenString);
    const moves = nextPosition.getMoves();

    if (!moves.some(move => move.srcCoords === srcCoords && move.destCoords === destCoords)) {
      throw new Error("Illegal move.");
    }

    const srcPiece = nextPosition.pieceMap.get(srcCoords)!,
      destPiece = nextPosition.pieceMap.get(destCoords);
    const isSrcPiecePawn = srcPiece.isPawn(),
      isPawnMoveOrCapture = isSrcPiecePawn || !!destPiece;
    nextPosition.startMove(srcCoords, destCoords);

    // unset castling rights on king move
    if (srcPiece.isKing()) {
      nextPosition.castlingRights[srcPiece.color][Wings.QUEEN_SIDE] = false;
      nextPosition.castlingRights[srcPiece.color][Wings.KING_SIDE] = false;

      // move rook on castling
      if (Math.abs(destCoords.y - srcCoords.y) === 2) {
        const wing = getWing(destCoords.y);
        nextPosition.startMove(
          c({ x: srcCoords.x, y: Piece.initialRookFiles[wing] })!,
          c({ x: srcCoords.x, y: destCoords.y - wing })!
        );
      }
    }

    // unset castling rights on rook move
    if (srcPiece.isRook() && !Piece.hasRookMoved(srcCoords, srcPiece.color))
      nextPosition.castlingRights[srcPiece.color][getWing(destCoords.y)] = false;

    // unset castling rights on rook capture
    if (destPiece?.isRook() && !Piece.hasRookMoved(destCoords, ~srcPiece.color))
      nextPosition.castlingRights[~srcPiece.color][getWing(srcCoords.y)] = false;

    // promotion
    if (isSrcPiecePawn && destCoords.x === Piece.initialPieceRanks[~srcPiece.color])
      srcPiece.promoteTo(promotionType ?? "Q");

    // update en passant
    nextPosition.enPassantCoords = (isSrcPiecePawn && Math.abs(destCoords.x - srcCoords.x) === 2)
      ? c({ x: destCoords.x - srcPiece.direction, y: destCoords.y })
      : null;

    nextPosition.colorToMove = ~nextPosition.colorToMove;
    nextPosition.halfMoveClock = isPawnMoveOrCapture ? 0 : nextPosition.halfMoveClock + 1;
    nextPosition.colorToMove === Colors.WHITE && nextPosition.fullMoveNumber++;

    this.addNextPosition(nextPosition);
    this.updateStatus();
  }

  playMoveUsingNotation(e2e4Notation: string) {
    const srcCoords = Coordinates.fromNotation(e2e4Notation.slice(0, 2)),
      destCoords = Coordinates.fromNotation(e2e4Notation.slice(2, 4)),
      promotionType = e2e4Notation[5];

    this.playMove(srcCoords!, destCoords!, promotionType as PromotionType | undefined);
  }

  updateStatus() {
    if (this.currentPosition.getMoves().length) {
      this.status = this.currentPosition.isTripleRepetition()
        ? GameStatuses.DRAW_BY_TRIPLE_REPETITION
        : GameStatuses.ACTIVE;
      return;
    }

    this.status = this.currentPosition.isCheck()
      ? GameStatuses.CHECKMATE
      : GameStatuses.STALEMATE;
  }

  addNextPosition(nextPosition: Position) {
    nextPosition.prev = this.currentPosition;
    if (!this.currentPosition.next)
      this.currentPosition.next = nextPosition;
    else
      this.currentPosition.variations.push(nextPosition);
    this.currentPosition = nextPosition;
  }

  /* enterMoves(moveString: string) {
    const moveStrings = moveString.match(/([a-h](x[a-h])?[1-8]|[BNRQK][a-h]?[1-8]?x?[a-h][1-8]|0\-0(\-0)?)[+#]?/g);
    if (!moveStrings)
      throw new Error("Invalid move string.");
    moveStrings.forEach(halfMove => {
      // if (halfMove.match(/^[a-h](x[a-h])?[1-8]$/)) {

      // }
    });
  } */
}

/*
[a-h](x[a-h])?[1-8] e(xd)4
[BNRQK][a-h]?[1-8]?x?[a-h][1-8] C(g)(5)(x)e4
0\-0(\-0)?
*/

enum GameStatuses {
  ACTIVE,
  CHECKMATE,
  STALEMATE,
  DRAW_BY_TRIPLE_REPETITION
}

function getWing(y: number): Wings {
  return y % 8 < 4 ? Wings.QUEEN_SIDE : Wings.KING_SIDE;
}