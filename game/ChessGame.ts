import Coordinates from "./Coordinates.ts";
import Position from "./Position.ts";

export default class ChessGame {
  currentPosition: Position;

  constructor({ fenString = Position.startFen }: { fenString?: string; moves?: string; } = {}) {
    this.currentPosition = new Position(fenString);
  }

  playMove(srcCoords: Coordinates, destCoords: Coordinates, promotionType?: PromotionType): void {
    if (this.getStatus() !== GameStatuses.ACTIVE)
      return console.log(`Game is inactive: ${this.currentPosition.fenString}`);

    const moves = this.currentPosition.getMoves();
    const move = moves.find(move => move.srcCoords === srcCoords && move.destCoords === destCoords);

    if (!move) {
      console.log(moves, srcCoords, destCoords);
      throw new Error("Illegal move.");
    }

    const nextPosition = this.currentPosition.clone();
    nextPosition.playMove({ ...move, promotionType });
    this.addNextPosition(nextPosition);
  }

  playMoveUsingNotation(e2e4Notation: string) {
    if (!/^([a-h][1-8]){2}[QRBN]?$/.test(e2e4Notation))
      throw new Error("Invalid move notation.");

    const srcCoords = Coordinates.fromNotation(e2e4Notation.slice(0, 2)),
      destCoords = Coordinates.fromNotation(e2e4Notation.slice(2, 4)),
      promotionType = e2e4Notation[5];

    this.playMove(srcCoords!, destCoords!, promotionType as PromotionType | undefined);
  }

  getStatus() {
    if (this.currentPosition.halfMoveClock >= 50)
      return GameStatuses.DRAW_BY_FIFTY_MOVE_RULE;

    if (this.currentPosition.getMoves().length)
      return this.currentPosition.isTripleRepetition()
        ? GameStatuses.DRAW_BY_TRIPLE_REPETITION
        : GameStatuses.ACTIVE;

    return this.currentPosition.isCheck()
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
  DRAW_BY_TRIPLE_REPETITION,
  DRAW_BY_FIFTY_MOVE_RULE
}