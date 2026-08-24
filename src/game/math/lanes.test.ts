import { describe, expect, it } from '@jest/globals';

import { createGameState } from '../engine/GameState';
import {
  applyLaneSwipe,
  beginLaneGesture,
  clampLane,
  endLaneGesture,
  interpolateToward,
  laneIndexToX,
  updateLaneGesture,
} from './lanes';

const THRESHOLD = 52;

describe('lanes', () => {
  it('maps lane indices to world X around the center lane', () => {
    expect(laneIndexToX(0, 1)).toBe(-1);
    expect(laneIndexToX(1, 1)).toBe(0);
    expect(laneIndexToX(2, 1)).toBe(1);
  });

  it('clamps lanes to the three playable lanes', () => {
    expect(clampLane(-4)).toBe(0);
    expect(clampLane(1)).toBe(1);
    expect(clampLane(9)).toBe(2);
  });

  it('interpolates toward the target without overshooting far past it', () => {
    let x = 0;
    for (let i = 0; i < 40; i += 1) {
      x = interpolateToward(x, 1, 1 / 60, 18);
    }
    expect(x).toBeGreaterThan(0.9);
    expect(x).toBeLessThanOrEqual(1);
  });

  it('moves exactly one lane on an aggressive swipe from center to the right', () => {
    const state = createGameState();
    applyLaneSwipe(state, 400, THRESHOLD);
    expect(state.targetLane).toBe(2);
  });

  it('moves only to center on one very large swipe left from the right lane', () => {
    const state = createGameState();
    state.targetLane = 2;
    applyLaneSwipe(state, -800, THRESHOLD);
    expect(state.targetLane).toBe(1);
  });

  it('requires two separate swipes to go from right to left', () => {
    const state = createGameState();
    state.targetLane = 2;
    applyLaneSwipe(state, -120, THRESHOLD);
    expect(state.targetLane).toBe(1);
    applyLaneSwipe(state, -120, THRESHOLD);
    expect(state.targetLane).toBe(0);
  });

  it('moves only to center on one large swipe right from the left lane', () => {
    const state = createGameState();
    state.targetLane = 0;
    applyLaneSwipe(state, 700, THRESHOLD);
    expect(state.targetLane).toBe(1);
  });

  it('ignores finger movement below the swipe threshold', () => {
    const state = createGameState();
    const changed = applyLaneSwipe(state, 20, THRESHOLD);
    expect(changed).toBe(false);
    expect(state.targetLane).toBe(1);
  });

  it('locks a gesture after the first lane change even if the swipe keeps growing', () => {
    const state = createGameState();
    const input = { gestureDx: 0, laneSwipeLocked: false };
    beginLaneGesture(input);
    updateLaneGesture(state, input, 80, THRESHOLD);
    expect(state.targetLane).toBe(2);
    updateLaneGesture(state, input, 360, THRESHOLD);
    expect(state.targetLane).toBe(2);
    endLaneGesture(state, input, THRESHOLD);
    expect(state.targetLane).toBe(2);
  });
});
