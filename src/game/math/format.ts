export function formatDistance(meters: number): string {
  const value = Math.max(0, Math.floor(meters));
  return value.toLocaleString('en-US');
}

export function isGameOver(armySize: number): boolean {
  return armySize <= 0;
}
