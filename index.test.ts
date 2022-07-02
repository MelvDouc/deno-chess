import ChessGame from "./game/ChessGame.ts";

// deno-lint-ignore ban-types
function _speedTest(callback: Function) {
  console.time("speed-test");
  callback();
  console.timeEnd("speed-test");
}

function playRandomGame(): void {
  const game = new ChessGame();
  let moves = game.currentPosition.getMoves();
  const notations = [];

  while (game.status === 0 && game.currentPosition.pieceMap.size > 2) {
    const i = game.currentPosition.fullMoveNumber - 1;
    const { srcCoords, destCoords } = moves[Math.floor(Math.random() * moves.length)];
    let halfMove = srcCoords.notation + destCoords.notation;
    const srcPiece = game.currentPosition.pieceMap.get(srcCoords)!;
    if (
      srcPiece.isPawn()
      && (destCoords.x === 0 && srcPiece.color === 0 || destCoords.x === 7 && srcPiece.color === -1)
    )
      halfMove += "Q";
    game.playMove(srcCoords, destCoords);
    moves = game.currentPosition.getMoves();
    if (!notations[i])
      notations[i] = `${i + 1}. ${halfMove}`;
    else
      notations[i] += ` ${halfMove}`;
  }

  console.log(notations.join(" "));
}

_speedTest(playRandomGame);