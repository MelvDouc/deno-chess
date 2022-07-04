import ChessGame from "../index.ts";

const game = new ChessGame();
game.playMoveUsingNotation("e2e4");
game.playMoveUsingNotation("e7e5");
game.playMoveUsingNotation("d2d4");
game.playMoveUsingNotation("e5d4");
game.playMoveUsingNotation("c2c4");
game.playMoveUsingNotation("d4c3");
game.logPosition();