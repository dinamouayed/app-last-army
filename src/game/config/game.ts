import type { CameraConfig, LaneIndex } from '../types';

export const GAME_CONFIG = {
  startingArmySize: 1,
  startingLane: 1 as LaneIndex,
  laneCount: 3,
  laneSpacing: 1,
  forwardSpeed: 17,
  laneLerpSpeed: 18,
  swipeThresholdPx: 52,
  swipeHintDuration: 2.6,
  soldierDrawScale: 1.35,
  maxVisibleSoldiers: 80,
  maxDeltaSeconds: 0.05,
  hudUpdateInterval: 0.08,
  camera: {
    playerDepth: 8,
    zFar: 72,
    zClip: 2.2,
    horizonYRatio: 0.31,
    playerYRatio: 0.76,
    roadHalfWidth: 1.7,
    nearRoadHalfWidthRatio: 0.5,
  } satisfies CameraConfig,
} as const;

export type GameConfig = typeof GAME_CONFIG;
