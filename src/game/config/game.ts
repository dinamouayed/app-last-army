import type { CameraConfig, LaneIndex } from '../types';

export const GAME_CONFIG = {
  startingArmySize: 1,
  startingLane: 1 as LaneIndex,
  laneCount: 3,
  laneSpacing: 1,
  /** Opening run pace — slower than the old constant 17 so the first seconds stay readable. */
  startForwardSpeed: 14,
  /** Terminal velocity. The run approaches this and never exceeds it. */
  maxForwardSpeed: 28,
  /**
   * Characteristic distance of the ease-out ramp (~63% of start→max).
   * Still climbing at 5000; near the cap around 10000.
   */
  speedRampDistance: 4350,
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

/**
 * Ease-out toward max speed: fast noticeable ramp at the start, then it
 * settles so long runs never become unplayable.
 */
export function forwardSpeedForDistance(
  distance: number,
  config: GameConfig = GAME_CONFIG,
): number {
  const start = config.startForwardSpeed;
  const max = config.maxForwardSpeed;
  const traveled = Math.max(0, distance);
  const t = 1 - Math.exp(-traveled / config.speedRampDistance);
  return Math.min(max, start + (max - start) * t);
}
