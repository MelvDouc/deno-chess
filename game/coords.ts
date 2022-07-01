export function indexToCoords(index: number): Coordinates {
  return {
    x: Math.floor(index / 8),
    y: index % 8
  };
}

export function coordsToIndex({ x, y }: Coordinates): number {
  return x * 8 + y;
}
