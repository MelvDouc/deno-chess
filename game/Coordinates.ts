export default class Coordinates {
  static #all: Record<number, Record<number, Coordinates>> = {};
  static #moveNotationRegex = /^[a-h][1-8]$/;

  static {
    for (let x = 0; x < 8; x++) {
      this.#all[x] = {};
      for (let y = 0; y < 8; y++) {
        this.#all[x][y] = new Coordinates(x, y);
      }
    }
  }

  static get(x: number, y: number): Coordinates | null {
    if (x in Coordinates.#all && y in Coordinates.#all[x])
      return Coordinates.#all[x][y];
    return null;
  }

  static fromNotation(notation: string): Coordinates | null {
    if (!Coordinates.#moveNotationRegex.test(notation))
      return null;

    const x = 8 - +notation[1],
      y = notation[0].charCodeAt(0) - 97;
    return Coordinates.#all[x][y];
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
    return Coordinates.get(this.x + xOffset, this.y + yOffset);
  }

  *getPeers(offsets: { xOffset: number; yOffset: number; }) {
    for (let peer = this.getPeer(offsets); peer; peer = peer.getPeer(offsets))
      yield peer;
  }
}

export function c({ x, y }: { x: number; y: number; }): Coordinates | null {
  return Coordinates.get(x, y);
}