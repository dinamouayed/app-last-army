import { describe, expect, it } from '@jest/globals';

import { GAME_CONFIG, forwardSpeedForDistance } from './game';

describe('forwardSpeedForDistance', () => {
  it('starts at the slow opening pace', () => {
    expect(forwardSpeedForDistance(0)).toBe(GAME_CONFIG.startForwardSpeed);
    expect(forwardSpeedForDistance(-10)).toBe(GAME_CONFIG.startForwardSpeed);
  });

  it('increases with distance but never exceeds the cap', () => {
    const early = forwardSpeedForDistance(200);
    const mid = forwardSpeedForDistance(500);
    const late = forwardSpeedForDistance(1500);
    const midRun = forwardSpeedForDistance(5000);
    const nearCap = forwardSpeedForDistance(10000);
    const veryLate = forwardSpeedForDistance(40000);

    expect(early).toBeGreaterThan(GAME_CONFIG.startForwardSpeed);
    expect(mid).toBeGreaterThan(early);
    expect(late).toBeGreaterThan(mid);
    expect(midRun).toBeGreaterThan(late);
    expect(nearCap).toBeGreaterThan(midRun);
    expect(veryLate).toBeGreaterThan(nearCap);
    expect(veryLate).toBeLessThanOrEqual(GAME_CONFIG.maxForwardSpeed);
    expect(GAME_CONFIG.maxForwardSpeed - veryLate).toBeLessThan(0.05);
  });

  it('is still climbing at 5000 and near the cap around 10000', () => {
    const at5000 = forwardSpeedForDistance(5000);
    const at10000 = forwardSpeedForDistance(10000);
    const span = GAME_CONFIG.maxForwardSpeed - GAME_CONFIG.startForwardSpeed;
    expect(at5000).toBeLessThan(GAME_CONFIG.startForwardSpeed + span * 0.75);
    expect(GAME_CONFIG.maxForwardSpeed - at10000).toBeLessThan(span * 0.15);
  });
});
