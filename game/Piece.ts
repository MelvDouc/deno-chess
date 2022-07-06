import { Colors, figureOffsets, initialsByPieceColorAndType, PieceTypes, pieceTypesByInitial, Wings } from "./constants.ts";

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
  coords!: Coordinates;
  type: PieceTypes;

  constructor(color: Colors, type: PieceTypes, coords?: Coordinates) {
    this.color = color;
    this.type = type;
    coords != null && (this.coords = coords);
  }

  // Used to convert a position to an FEN string.
  get initial(): string {
    return initialsByPieceColorAndType[this.color][this.type];
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

  get wing() {
    return this.coords.y < 4 ? Wings.QUEEN_SIDE : Wings.KING_SIDE;
  }

  // To avoid having to export the PieceTypes enum.
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