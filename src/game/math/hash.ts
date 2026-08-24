export function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function hashRange(n: number, min: number, max: number): number {
  return min + hash01(n) * (max - min);
}
