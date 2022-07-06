import ChessGame from "../index.ts";

console.time("speed-test");
const game = new ChessGame();
game.playHalfMoveUsingNotation("e2e4");
game.playHalfMoveUsingNotation("e7e5");
game.playHalfMoveUsingNotation("d1h5");
game.playHalfMoveUsingNotation("b8c6");
game.playHalfMoveUsingNotation("f1c4");
game.playHalfMoveUsingNotation("g8f6");
game.playHalfMoveUsingNotation("h5f7");
console.log(game.getStatus());
console.timeEnd("speed-test");