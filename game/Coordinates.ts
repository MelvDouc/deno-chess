export default class Coordinates {
  static all: Record<number, Record<number, Coordinates>> = {};

  static {
    for (let x = 0; x < 8; x++) {
      this.all[x] = {};
      for (let y = 0; y < 8; y++) {
        this.all[x][y] = new Coordinates(x, y);
      }
    }
  }

  static isInBounds(n: number) {
    return n >= 0 && n < 8;
  }

  static fromNotation(notation: string): Coordinates | null {
    if (!/^[a-h][1-8]$/.test(notation))
      return null;

    const x = 8 - +notation[1],
      y = notation[0].charCodeAt(0) - 97;
    return Coordinates.all[x][y];
  }

  readonly x: number;
  readonly y: number;
  #notation!: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get notation(): string {
    this.#notation ??= String.fromCharCode(this.y + 97) + String(8 - this.x);
    return this.#notation;
  }

  getPeer({ xOffset, yOffset }: { xOffset: number; yOffset: number; }) {
    const x = this.x + xOffset,
      y = this.y + yOffset;
    return (Coordinates.isInBounds(x) && Coordinates.isInBounds(y))
      ? Coordinates.all[x][y]
      : null;
  }

  *getPeers(offsets: { xOffset: number; yOffset: number; }) {
    let peer = this.getPeer(offsets);
    while (peer) {
      yield peer;
      peer = peer.getPeer(offsets);
    }
  }
}

export function c(coords: { x: number; y: number; }): Coordinates | null {
  if (Coordinates.isInBounds(coords.x) && Coordinates.isInBounds(coords.y))
    return Coordinates.all[coords.x][coords.y];
  return null;
}