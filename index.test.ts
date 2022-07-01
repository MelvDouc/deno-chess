import ChessGame from "./game/ChessGame.ts";
import Position from "./game/Position.ts";

// deno-lint-ignore ban-types
function speedTest(callback: Function) {
  console.time("speed-test");
  callback();
  console.timeEnd("speed-test");
}

speedTest(() => {
  const game = new ChessGame();
  let moves = game.currentPosition.getMoves();
  const notations: string[] = [];

  while (game.status === 0 && game.currentPosition.pieceMap.size > 2) {
    const randomIndex = Math.floor(Math.random() * moves.length);
    const { srcIndex, destIndex } = moves[randomIndex];
    notations.push(game.currentPosition.pieceMap.get(srcIndex)!.initial.toUpperCase() + Position.indexToNotation(destIndex));
    game.playMove(srcIndex, destIndex);
    moves = game.currentPosition.getMoves();
  }

  console.log(notations.join(" "));
  game.currentPosition.log();
});