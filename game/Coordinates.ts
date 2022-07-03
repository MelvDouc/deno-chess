export default class Coordinates {
  static #all: Coordinates[][] = Array.from({ length: 8 }, (_, x) => {
    return Array.from({ length: 8 }, (_, y) => new Coordinates(x, y));
  });
  static #moveNotationRegex = /^[a-h][1-8]$/;

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

  getPeer(xOffset: number, yOffset: number) {
    return Coordinates.get(this.x + xOffset, this.y + yOffset);
  }

  *getPeers(xOffset: number, yOffset: number) {
    for (let peer = this.getPeer(xOffset, yOffset); peer; peer = peer.getPeer(xOffset, yOffset))
      yield peer;
  }
}