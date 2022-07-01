import { Colors, Wings } from "./constants.ts";

export default class Piece {
  static readonly pawnDirections = {
    [Colors.WHITE]: -1,
    [Colors.BLACK]: 1
  };

  static readonly initialRookIndices = {
    [Colors.WHITE]: {
      [Wings.QUEEN_SIDE]: 56,
      [Wings.KING_SIDE]: 63
    },
    [Colors.BLACK]: {
      [Wings.QUEEN_SIDE]: 0,
      [Wings.KING_SIDE]: 7
    }
  };

  static readonly castledKingIndices = {
    [Colors.WHITE]: {
      [Wings.QUEEN_SIDE]: 58,
      [Wings.KING_SIDE]: 62
    },
    [Colors.BLACK]: {
      [Wings.QUEEN_SIDE]: 2,
      [Wings.KING_SIDE]: 6
    }
  };

  static readonly initialPieceRanks = {
    [Colors.WHITE]: 7,
    [Colors.BLACK]: 0
  };

  static readonly initialPawnRanks = {
    [Colors.WHITE]: 6,
    [Colors.BLACK]: 1
  };

  static fromInitial(initial: string): Piece {
    const lowercase = initial.toLowerCase();
    return new Piece(
      (initial === lowercase) ? Colors.BLACK : Colors.WHITE,
      pieceTypesByInitial[lowercase]
    );
  }

  static hasRookMoved(index: number, color: Colors): boolean {
    return Object.values(Piece.initialRookIndices[color]).includes(index);
  }

  readonly color: Colors;
  type: PieceTypes;

  constructor(color: Colors, type: PieceTypes) {
    this.color = color;
    this.type = type;
  }

  get initial(): string {
    const _initial = initialsByPieceType[this.type];
    return (this.color === Colors.WHITE) ? _initial.toUpperCase() : _initial;
  }

  get direction(): number {
    return Piece.pawnDirections[this.color];
  }

  get offsets(): PieceOffsets {
    if (this.type === PieceTypes.PAWN)
      return {
        x: [this.direction, this.direction],
        y: [-1, 1]
      };
    return figureOffsets[this.type];
  }

  isBishop() { return this.type === PieceTypes.BISHOP; }
  isKing() { return this.type === PieceTypes.KING; }
  isKnight() { return this.type === PieceTypes.KNIGHT; }
  isPawn() { return this.type === PieceTypes.PAWN; }
  isQueen() { return this.type === PieceTypes.QUEEN; }
  isRook() { return this.type === PieceTypes.ROOK; }

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
