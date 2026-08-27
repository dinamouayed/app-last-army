import type { SegmentKind } from '../config/difficulty';
import { DIFFICULTY_CONFIG } from '../config/difficulty';
import { createRngState, generateRunSeed } from '../math/rng';

export interface WorldSegment {
  id: number;
  active: boolean;
  kind: SegmentKind;
  startDistance: number;
  length: number;
  materialized: boolean;
  waveRemaining: number;
  waveTimer: number;
}

export interface WorldRuntimeState {
  runSeed: number;
  rngState: number;
  segments: WorldSegment[];
  nextSegmentId: number;
  worldFrontier: number;
  lastSegmentKind: SegmentKind | null;
  sameKindStreak: number;
  pendingRecovery: boolean;
  lastWeaponDistance: number;
}

export function createEmptySegment(): WorldSegment {
  return {
    id: 0,
    active: false,
    kind: 'GateChoice',
    startDistance: 0,
    length: 0,
    materialized: false,
    waveRemaining: 0,
    waveTimer: 0,
  };
}

export function createWorldRuntimeState(seed?: number): WorldRuntimeState {
  const runSeed = seed ?? generateRunSeed();
  return {
    runSeed,
    rngState: createRngState(runSeed),
    segments: [],
    nextSegmentId: 1,
    worldFrontier: DIFFICULTY_CONFIG.opening[0]?.startDistance ?? 20,
    lastSegmentKind: null,
    sameKindStreak: 0,
    pendingRecovery: false,
    lastWeaponDistance: -DIFFICULTY_CONFIG.minWeaponSpacing,
  };
}

export function acquireSegment(state: WorldRuntimeState): WorldSegment | null {
  for (let i = 0; i < state.segments.length; i += 1) {
    const segment = state.segments[i];
    if (segment && !segment.active) {
      return segment;
    }
  }
  if (state.segments.length >= DIFFICULTY_CONFIG.maxSegments) {
    return null;
  }
  const segment = createEmptySegment();
  state.segments.push(segment);
  return segment;
}

export function recycleSegment(segment: WorldSegment): void {
  segment.active = false;
  segment.materialized = false;
  segment.waveRemaining = 0;
  segment.waveTimer = 0;
}

export function livingSegmentCount(segments: WorldSegment[]): number {
  let count = 0;
  for (let i = 0; i < segments.length; i += 1) {
    if (segments[i]?.active) {
      count += 1;
    }
  }
  return count;
}

export function currentSegmentKind(state: {
  segments: WorldSegment[];
  distance: number;
}): string {
  for (let i = 0; i < state.segments.length; i += 1) {
    const segment = state.segments[i];
    if (!segment?.active) {
      continue;
    }
    if (
      state.distance >= segment.startDistance &&
      state.distance < segment.startDistance + segment.length
    ) {
      return segment.kind;
    }
  }
  return 'runway';
}
