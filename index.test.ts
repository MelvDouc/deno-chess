import ChessGame from "./game/ChessGame.ts";

// deno-lint-ignore ban-types
function _speedTest(callback: Function) {
  console.time("speed-test");
  callback();
  console.timeEnd("speed-test");
}

function playRandomGame(): void {
  const game = new ChessGame();
  console.log(game.currentPosition.getMoves());
  // let moves = game.currentPosition.getMoves();
  // const notations: string[] = [];

  // while (game.status === 0 && game.currentPosition.pieceMap.size > 2) {
  //   const randomIndex = Math.floor(Math.random() * moves.length);
  //   const { srcIndex, destIndex } = moves[randomIndex];
  //   const notation = `${Position.indexToNotation(srcIndex)}${Position.indexToNotation(destIndex)}`;
  //   const i = game.currentPosition.fullMoveNumber - 1;
  //   if (!notations[i])
  //     notations[i] = `${game.currentPosition.fullMoveNumber}. ${notation}`;
  //   else
  //     notations[i] += ` ${notation}`;
  //   game.playMove(srcIndex, destIndex);
  //   moves = game.currentPosition.getMoves();
  // }

  // console.log(notations.join(" "));
  // game.currentPosition.log();
}

playRandomGame();