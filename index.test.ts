import ChessGame from "./game/ChessGame.ts";
import Position from "./game/Position.ts";

// deno-lint-ignore ban-types
function _speedTest(callback: Function) {
  console.time("speed-test");
  callback();
  console.timeEnd("speed-test");
}

/*function playRandomGame(): void {
  const game = new ChessGame();
  let moves = game.currentPosition.getMoves();
  let print = "";

  while (game.currentPosition.pieceMap.size > 2) {
    const { srcCoords, destCoords } = moves[Math.floor(Math.random() * moves.length)];

    let halfMove = srcCoords.notation + destCoords.notation;
    let promotionType: PromotionType | undefined = undefined;
    const srcPiece = game.currentPosition.pieceMap.get(srcCoords)!;
    if (
      srcPiece.isPawn()
      && (destCoords.x === 0 && srcPiece.color === 0 || destCoords.x === 7 && srcPiece.color === -1)
    ) {
      promotionType = ["Q", "R", "B", "N"][Math.floor(Math.random() * 4)] as PromotionType;
      halfMove += promotionType;
    }

    game.playMove(srcCoords, destCoords, promotionType);
    moves = game.currentPosition.getMoves();

    if (!print)
      print = `${game.currentPosition.fullMoveNumber}. ${halfMove}`;
    else {
      console.log(`${print} ${halfMove}`);
      print = "";
    }

    if (game.getStatus() !== 0)
      break;
  }
} */

function countLegalMoves(pos: Position, max: number, color: Colors): number {
  const moves = pos.getMoves();

  if (pos.fullMoveNumber === max && pos.colorToMove === color)
    return moves.length;

  return moves.reduce((total, move) => {
    return total + countLegalMoves(pos.clone().playMove(move), max, color);
  }, 0);
}

_speedTest(() => {
  console.log(
    countLegalMoves(new ChessGame().currentPosition, 3, 0)
  );
});