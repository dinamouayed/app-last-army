import type { LaneIndex } from '../types';

export interface Hazard {
  id: number;
  groupId: number;
  active: boolean;
  lane: LaneIndex;
  x: number;
  z: number;
  activated: boolean;
  fadeT: number;
}

export interface HazardRuntimeState {
  hazards: Hazard[];
}

export function createHazardRuntimeState(): HazardRuntimeState {
  return {
    hazards: [],
  };
}

export function createEmptyHazard(): Hazard {
  return {
    id: 0,
    groupId: 0,
    active: false,
    lane: 1,
    x: 0,
    z: 0,
    activated: false,
    fadeT: 0,
  };
}

export function livingHazardCount(hazards: Hazard[]): number {
  let count = 0;
  for (let i = 0; i < hazards.length; i += 1) {
    if (hazards[i]?.active) {
      count += 1;
    }
  }
  return count;
}
