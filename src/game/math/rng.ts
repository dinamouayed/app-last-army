/** Mulberry32 — fast, seedable, good enough for gameplay rolls. */

export function generateRunSeed(): number {
  return ((Math.random() * 0xffffffff) >>> 0) || 1;
}

export function createRngState(seed: number): number {
  return seed >>> 0;
}

export function nextMulberry32(box: { rngState: number }): number {
  box.rngState = (box.rngState + 0x6d2b79f5) >>> 0;
  let t = box.rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function createRng(seed: number): () => number {
  const box = { rngState: createRngState(seed) };
  return () => nextMulberry32(box);
}

export function rngFromState(box: { rngState: number }): () => number {
  return () => nextMulberry32(box);
}
