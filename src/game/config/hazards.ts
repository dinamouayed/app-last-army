import type { LaneIndex } from '../types';

export const HAZARD_CONFIG = {
  maxHazards: 8,
  /** World-space depth of the TNT crate hit box. */
  length: 2.4,
  spawnAhead: 52,
  minSpawnAhead: 36,
  /** No TNT crates in the opening tutorial stretch. */
  firstHazardDistance: 130,
  activationFeedbackDuration: 0.34,
  /** Visible fireball after a crate is hit — game over waits for this. */
  explosionDuration: 0.58,
  explosionShakeDuration: 0.36,
  explosionParticleCount: 18,
  /** Chance a set opens two lanes (never three). */
  twoLaneChanceStart: 0.18,
  twoLaneChanceLate: 0.52,
} as const;

export type HazardConfig = typeof HAZARD_CONFIG;

export function pickHazardLanes(twoLane: boolean, rng: () => number): LaneIndex[] {
  if (!twoLane) {
    const lane = Math.min(2, Math.floor(rng() * 3)) as LaneIndex;
    return [lane];
  }
  const skip = Math.min(2, Math.floor(rng() * 3)) as LaneIndex;
  const lanes: LaneIndex[] = [];
  for (let lane = 0; lane < 3; lane += 1) {
    if (lane !== skip) {
      lanes.push(lane as LaneIndex);
    }
  }
  return lanes;
}
