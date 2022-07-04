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
    this.#currentPosition = new Position(fenString).addMoves();
  }

  get board() {
    return Array.from({ length: 8 }, (_, x) => {
      return Array.from({ length: 8 }, (_, y) => {
        const piece = this.#currentPosition.pieceMap.get(Coordinates.get(x, y)!);
        return piece
          ? {
            color: ChessGame.Colors[piece.color === Colors.WHITE ? "WHITE" : "BLACK"],
            type: piece.initial.toLowerCase()
          }
          : null;
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

  get enPassantSquare(): string {
    return this.#currentPosition.enPassantCoords?.notation ?? "-";
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

  playHalfMove(srcCoords: { x: number; y: number; }, destCoords: { x: number; y: number; }, promotionType?: PromotionType): boolean {
    const status = this.getStatus();
    if (status !== GameStatuses.ACTIVE) {
      warn(`Game is inactive: ${status}.`);
      return false;
    }

    const _srcCoords = Coordinates.get(srcCoords.x, srcCoords.y);
    const _destCoords = Coordinates.get(destCoords.x, destCoords.y);

    if (!_srcCoords) {
      warn("Invalid source coordinates.");
      return false;
    }

    if (!_destCoords) {
      warn("Invalid destination coordinates.");
      return false;
    }

    const move = this.#currentPosition.moves.find(move => move.srcCoords === _srcCoords && move.destCoords === _destCoords);

    if (!move) {
      warn(`Illegal move: ${_srcCoords.notation}-${_destCoords.notation} in ${this.#currentPosition.fenString}`);
      return false;
    }

    this.#addNextPosition(
      this.#currentPosition.clone().playMove({ ...move, promotionType }).addMoves()
    );
    return true;
  }

  playMoveUsingNotation(e2e4QNotation: string): boolean {
    if (!/^([a-h][1-8]){2}[QRBN]?$/.test(e2e4QNotation))
      throw new Error("Invalid move notation.");

    return this.playHalfMove(
      Coordinates.fromNotation(e2e4QNotation.slice(0, 2))!,
      Coordinates.fromNotation(e2e4QNotation.slice(2, 4))!,
      e2e4QNotation[5] as PromotionType | undefined
    );
  }

  getStatus() {
    if (!this.#currentPosition.moves.length) {
      return this.#currentPosition.isCheck()
        ? GameStatuses.CHECKMATE
        : GameStatuses.STALEMATE;
    }

    if (this.#currentPosition.halfMoveClock >= 50)
      return GameStatuses.DRAW_BY_FIFTY_MOVE_RULE;

    if (this.#currentPosition.isTripleRepetition())
      return GameStatuses.DRAW_BY_TRIPLE_REPETITION;

    return GameStatuses.ACTIVE;
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

  logPosition(): void {
    this.#currentPosition.log();
  }

  #addNextPosition(nextPosition: Position): void {
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

function warn(message: string) {
  console.log(`\x1b[33m/!\\\x1b[0m ${message}`);
}