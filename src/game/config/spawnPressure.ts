/** Lightweight distance-based combat pressure — not the final Phase 8 system. */

export interface SpawnPressureTier {
  minDistance: number;
  minGroupSize: number;
  maxGroupSize: number;
  spawnInterval: number;
}

export const SPAWN_PRESSURE_TIERS: readonly SpawnPressureTier[] = [
  { minDistance: 0, minGroupSize: 1, maxGroupSize: 2, spawnInterval: 2.6 },
  { minDistance: 180, minGroupSize: 2, maxGroupSize: 3, spawnInterval: 2.2 },
  { minDistance: 420, minGroupSize: 3, maxGroupSize: 5, spawnInterval: 1.85 },
  { minDistance: 800, minGroupSize: 3, maxGroupSize: 6, spawnInterval: 1.55 },
] as const;

export function getSpawnPressure(distance: number): SpawnPressureTier {
  let tier = SPAWN_PRESSURE_TIERS[0]!;
  for (let i = 0; i < SPAWN_PRESSURE_TIERS.length; i += 1) {
    const candidate = SPAWN_PRESSURE_TIERS[i];
    if (candidate && distance >= candidate.minDistance) {
      tier = candidate;
    }
  }
  return tier;
}

export function pickGroupSize(tier: SpawnPressureTier, rng: () => number): number {
  const span = tier.maxGroupSize - tier.minGroupSize;
  return tier.minGroupSize + Math.floor(rng() * (span + 1));
}
