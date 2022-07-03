import { Colors, GameStatuses, Wings } from "./constants.ts";
import Coordinates from "./Coordinates.ts";
import Position from "./Position.ts";

export default class ChessGame {
  static readonly Colors = {
    WHITE: "white",
    BLACK: "black"
  };

  static readonly Wings = {
    QUEEN_SIDE: "queen's side",
    KING_SIDE: "king's side"
  };

  static readonly Statuses = GameStatuses;

  #currentPosition: Position;

  constructor({ fenString = Position.startFen }: { fenString?: string; moves?: string; } = {}) {
    this.#currentPosition = new Position(fenString);
  }

  get board(): (Piece | null)[][] {
    return Array.from({ length: 8 }, (_, x) => {
      return Array.from({ length: 8 }, (_, y) => {
        return this.#currentPosition.pieceMap.get(Coordinates.get(x, y)!) ?? null;
      });
    });
  }

  get castlingRights() {
    return {
      [ChessGame.Colors.WHITE]: {
        [ChessGame.Wings.QUEEN_SIDE]: this.#currentPosition.castlingRights[Colors.WHITE][Wings.QUEEN_SIDE],
        [ChessGame.Wings.KING_SIDE]: this.#currentPosition.castlingRights[Colors.WHITE][Wings.KING_SIDE],
      },
      [ChessGame.Colors.BLACK]: {
        [ChessGame.Wings.QUEEN_SIDE]: this.#currentPosition.castlingRights[Colors.WHITE][Wings.QUEEN_SIDE],
        [ChessGame.Wings.KING_SIDE]: this.#currentPosition.castlingRights[Colors.WHITE][Wings.KING_SIDE],
      }
    };
  }

  get colorToMove() {
    return this.#currentPosition.colorToMove === Colors.WHITE
      ? ChessGame.Colors.WHITE
      : ChessGame.Colors.BLACK;
  }

  get halfMoveClock(): number {
    return this.#currentPosition.halfMoveClock;
  }

  get fullMoveNumber(): number {
    return this.#currentPosition.fullMoveNumber;
  }

  get fenString(): string {
    return this.#currentPosition.fenString;
  }

  playMove(srcCoords: { x: number; y: number; }, destCoords: { x: number; y: number; }, promotionType?: PromotionType): void {
    if (this.getStatus() !== GameStatuses.ACTIVE)
      return console.log(`Game is inactive: ${this.#currentPosition.fenString}`);

    const _srcCoords = Coordinates.get(srcCoords.x, srcCoords.y);
    const _destCoords = Coordinates.get(destCoords.x, destCoords.y);

    if (!_srcCoords)
      throw new Error("Invalid source coordinates");

    if (!_destCoords)
      throw new Error("Invalid destination coordinates");

    const moves = this.#currentPosition.getMoves();
    const move = moves.find(move => move.srcCoords === _srcCoords && move.destCoords === _destCoords);

    if (!move)
      return console.log(`Illegal move: ${_srcCoords.notation}-${_destCoords.notation} in ${this.#currentPosition.fenString}`);

    const nextPosition = this.#currentPosition.clone();
    nextPosition.playMove({ ...move, promotionType });
    this.#addNextPosition(nextPosition);
  }

  playMoveUsingNotation(e2e4Notation: string) {
    if (!/^([a-h][1-8]){2}[QRBN]?$/.test(e2e4Notation))
      throw new Error("Invalid move notation.");

    this.playMove(
      Coordinates.fromNotation(e2e4Notation.slice(0, 2))!,
      Coordinates.fromNotation(e2e4Notation.slice(2, 4))!,
      e2e4Notation[5] as PromotionType | undefined
    );
  }

  getStatus() {
    if (this.#currentPosition.halfMoveClock >= 50)
      return GameStatuses.DRAW_BY_FIFTY_MOVE_RULE;

    if (this.#currentPosition.getMoves().length)
      return this.#currentPosition.isTripleRepetition()
        ? GameStatuses.DRAW_BY_TRIPLE_REPETITION
        : GameStatuses.ACTIVE;

    return this.#currentPosition.isCheck()
      ? GameStatuses.CHECKMATE
      : GameStatuses.STALEMATE;
  }

  goToPreviousMove(): this {
    if (this.#currentPosition.prev)
      this.#currentPosition = this.#currentPosition.prev;
    return this;
  }

  goToNextMove(variationIndex = 0): this {
    if (this.#currentPosition.nextPositions[variationIndex])
      this.#currentPosition = this.#currentPosition.nextPositions[variationIndex];
    return this;
  }

  #addNextPosition(nextPosition: Position) {
    nextPosition.prev = this.#currentPosition;
    this.#currentPosition.nextPositions.push(nextPosition);
    this.#currentPosition = nextPosition;
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