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
    const nearCap = forwardSpeedForDistance(5000);
    const veryLate = forwardSpeedForDistance(20000);

    expect(early).toBeGreaterThan(GAME_CONFIG.startForwardSpeed);
    expect(mid).toBeGreaterThan(early);
    expect(late).toBeGreaterThan(mid);
    expect(nearCap).toBeGreaterThan(late);
    expect(veryLate).toBeGreaterThan(nearCap);
    expect(veryLate).toBeLessThanOrEqual(GAME_CONFIG.maxForwardSpeed);
    expect(GAME_CONFIG.maxForwardSpeed - veryLate).toBeLessThan(0.05);
  });

  it('is still well below the cap at 1500, where a typical run can already be', () => {
    const at1500 = forwardSpeedForDistance(1500);
    const span = GAME_CONFIG.maxForwardSpeed - GAME_CONFIG.startForwardSpeed;
    expect(at1500).toBeLessThan(GAME_CONFIG.startForwardSpeed + span * 0.6);
  });

  it('reaches about the former constant pace around 500', () => {
    expect(forwardSpeedForDistance(500)).toBeCloseTo(17, 0);
  });
});
