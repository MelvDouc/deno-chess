import ChessGame from "../index.ts";

const game = new ChessGame();
game.playHalfMoveUsingNotation("e2e4");
game.playHalfMoveUsingNotation("e7e5");
game.playHalfMoveUsingNotation("d2d4");
game.playHalfMoveUsingNotation("e5d4");
game.playHalfMoveUsingNotation("c2c4");
game.playHalfMoveUsingNotation("d4c3");
game.playHalfMoveUsingNotation("b1c3");
game.logPosition();