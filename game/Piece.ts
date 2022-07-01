import { Colors, Wings } from "./constants.ts";

export default class Piece {
  // Indicates wether a pawn moves up or down the board.
  // Used for move generation.
  static readonly pawnDirections = {
    [Colors.WHITE]: -1,
    [Colors.BLACK]: 1
  };

  // The initial placement of each rook. Used for castling.
  static readonly initialRookFiles = {
    [Wings.QUEEN_SIDE]: 0,
    [Wings.KING_SIDE]: 7
  };

  // Where a king will be placed after castling.
  static readonly castledKingFiles = {
    [Wings.QUEEN_SIDE]: 2,
    [Wings.KING_SIDE]: 6
  };

  static readonly initialPieceRanks = {
    [Colors.WHITE]: 7,
    [Colors.BLACK]: 0
  };

  static readonly initialPawnRanks = {
    [Colors.WHITE]: 6,
    [Colors.BLACK]: 1
  };

  // Used to convert the piece characters in an FEN string to instances of this class.
  static fromInitial(initial: string): Piece {
    const lowercase = initial.toLowerCase();
    return new Piece(
      (initial === lowercase) ? Colors.BLACK : Colors.WHITE,
      pieceTypesByInitial[lowercase]
    );
  }

  // Needed to determine if castling rights should be unset when a rook moves or is captured.
  static hasRookMoved(coords: Coordinates, color: Colors): boolean {
    return coords.x === Piece.initialPieceRanks[color]
      && Object.values(Piece.initialRookFiles).includes(coords.y);
  }

  readonly color: Colors;
  type: PieceTypes;
  coords!: Coordinates;

  constructor(color: Colors, type: PieceTypes) {
    this.color = color;
    this.type = type;
  }

  // Used to convert a position to an FEN string.
  get initial(): string {
    const _initial = initialsByPieceType[this.type];
    return (this.color === Colors.WHITE) ? _initial.toUpperCase() : _initial;
  }

  get direction(): number {
    return Piece.pawnDirections[this.color];
  }

  // Needed to determine in what directions a piece moves.
  get offsets(): PieceOffsets {
    if (this.type === PieceTypes.PAWN)
      return {
        x: [this.direction, this.direction],
        y: [-1, 1]
      };
    return figureOffsets[this.type];
  }

  // Makes it unnecessary to export the PieceTypes enum.
  isBishop() { return this.type === PieceTypes.BISHOP; }
  isKing() { return this.type === PieceTypes.KING; }
  isKnight() { return this.type === PieceTypes.KNIGHT; }
  isPawn() { return this.type === PieceTypes.PAWN; }
  isQueen() { return this.type === PieceTypes.QUEEN; }
  isRook() { return this.type === PieceTypes.ROOK; }

  isOnInitialRank(): boolean {
    if (this.type === PieceTypes.PAWN)
      return this.coords.x === Piece.initialPawnRanks[this.color];
    return this.coords.x === Piece.initialPieceRanks[this.color];
  }

  // See previous comment.
  promoteTo(type: PromotionType): void {
    switch (type) {
      case "Q":
        this.type = PieceTypes.QUEEN;
        break;
      case "R":
        this.type = PieceTypes.ROOK;
        break;
      case "B":
        this.type = PieceTypes.BISHOP;
        break;
      case "N":
        this.type = PieceTypes.KNIGHT;
    }
  }
}

// ===== ===== ===== ===== =====
// Utils
// ===== ===== ===== ===== =====

enum PieceTypes {
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING
}

const pieceTypesByInitial: Record<string, PieceTypes> = {
  p: PieceTypes.PAWN,
  n: PieceTypes.KNIGHT,
  b: PieceTypes.BISHOP,
  r: PieceTypes.ROOK,
  q: PieceTypes.QUEEN,
  k: PieceTypes.KING
};

const initialsByPieceType = {
  [PieceTypes.PAWN]: "p",
  [PieceTypes.KNIGHT]: "n",
  [PieceTypes.BISHOP]: "b",
  [PieceTypes.ROOK]: "r",
  [PieceTypes.QUEEN]: "q",
  [PieceTypes.KING]: "k"
};

const rookOffsets = {
  x: [-1, 0, 0, 1],
  y: [0, -1, 1, 0]
};

const bishopOffsets = {
  x: [-1, -1, 1, 1],
  y: [-1, 1, -1, 1]
};

const adjacentOffsets = {
  x: rookOffsets.x.concat(bishopOffsets.x),
  y: rookOffsets.y.concat(bishopOffsets.y)
};

const figureOffsets = {
  [PieceTypes.KNIGHT]: {
    x: [-2, -2, -1, -1, 1, 1, 2, 2],
    y: [-1, 1, -2, 2, -2, 2, -1, 1]
  },
  [PieceTypes.BISHOP]: bishopOffsets,
  [PieceTypes.ROOK]: rookOffsets,
  [PieceTypes.QUEEN]: adjacentOffsets,
  [PieceTypes.KING]: adjacentOffsets
};
