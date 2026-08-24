import type { GameState, InputState, LaneIndex } from '../types';

export function clampLane(lane: number): LaneIndex {
  if (lane <= 0) {
    return 0;
  }
  if (lane >= 2) {
    return 2;
  }
  return 1;
}

export function laneIndexToX(lane: number, laneSpacing: number): number {
  return (lane - 1) * laneSpacing;
}

export function interpolateToward(
  current: number,
  target: number,
  dt: number,
  lerpSpeed: number,
): number {
  const t = 1 - Math.exp(-lerpSpeed * dt);
  return current + (target - current) * t;
}

export function swipeDirection(
  totalDx: number,
  thresholdPx: number,
): -1 | 0 | 1 {
  if (totalDx >= thresholdPx) {
    return 1;
  }
  if (totalDx <= -thresholdPx) {
    return -1;
  }
  return 0;
}

export function applyLaneSwipe(
  state: GameState,
  totalDx: number,
  thresholdPx: number,
): boolean {
  const direction = swipeDirection(totalDx, thresholdPx);
  if (direction === 0) {
    return false;
  }

  const nextLane = clampLane(state.targetLane + direction);
  if (nextLane === state.targetLane) {
    return false;
  }

  state.targetLane = nextLane;
  state.hasChangedLane = true;
  return true;
}

export function beginLaneGesture(input: InputState): void {
  input.gestureDx = 0;
  input.laneSwipeLocked = false;
}

export function updateLaneGesture(
  state: GameState,
  input: InputState,
  gestureDx: number,
  thresholdPx: number,
): void {
  input.gestureDx = gestureDx;
  if (input.laneSwipeLocked) {
    return;
  }
  if (applyLaneSwipe(state, gestureDx, thresholdPx)) {
    input.laneSwipeLocked = true;
  }
}

export function endLaneGesture(
  state: GameState,
  input: InputState,
  thresholdPx: number,
): void {
  if (!input.laneSwipeLocked) {
    applyLaneSwipe(state, input.gestureDx, thresholdPx);
  }
  input.laneSwipeLocked = true;
}
