import { describe, expect, it } from '@jest/globals';

import { FEEL_CONFIG } from '../config/feel';
import { createGameState } from '../engine/GameState';
import { clearFeedback, pushFeedback, spawnFloatingText } from '../feel/feedback';
import {
  applyBossDeathFeel,
  cameraShakeOffset,
  spawnHitSparks,
  updateFeelClock,
  updateFeelVisuals,
} from './FeelSystem';

describe('feedback queue', () => {
  it('stores events until they are drained', () => {
    const state = createGameState();
    pushFeedback(state, 'weaponFire', { weaponId: 'machineGun' });
    pushFeedback(state, 'bossDeath');
    expect(state.feedbackCount).toBe(2);
    expect(state.feedback[0]?.kind).toBe('weaponFire');
    expect(state.feedback[0]?.weaponId).toBe('machineGun');
    expect(state.feedback[1]?.kind).toBe('bossDeath');
    clearFeedback(state);
    expect(state.feedbackCount).toBe(0);
  });

  it('drops events past the pool cap', () => {
    const state = createGameState();
    for (let i = 0; i < FEEL_CONFIG.maxFeedbackEvents + 8; i += 1) {
      pushFeedback(state, 'enemyHit');
    }
    expect(state.feedbackCount).toBe(FEEL_CONFIG.maxFeedbackEvents);
  });
});

describe('camera shake and slow-mo', () => {
  it('eases camera shake out without a leftover jitter', () => {
    const state = createGameState();
    state.cameraShakeMag = 12;
    for (let i = 0; i < 90; i += 1) {
      updateFeelClock(state, 1 / 60);
    }
    expect(state.cameraShakeMag).toBe(0);
    expect(cameraShakeOffset(state, 1).x).toBe(0);
  });

  it('returns timeScale to 1 after boss-death slow-mo', () => {
    const state = createGameState();
    applyBossDeathFeel(state);
    expect(state.slowMoT).toBeGreaterThan(0);
    expect(state.cameraShakeMag).toBeGreaterThan(0);
    updateFeelClock(state, 0);
    expect(state.timeScale).toBeLessThan(1);
    updateFeelClock(state, FEEL_CONFIG.slowMoDuration + 0.05);
    expect(state.slowMoT).toBe(0);
    expect(state.timeScale).toBe(1);
  });
});

describe('hit sparks and floating text', () => {
  it('spawns pooled hit sparks', () => {
    const state = createGameState();
    spawnHitSparks(state, 0.2, 12);
    const hits = state.particles.filter((particle) => particle.active && particle.kind === 'hit');
    expect(hits.length).toBe(FEEL_CONFIG.hitSparkCount);
  });

  it('expires floating text', () => {
    const state = createGameState();
    spawnFloatingText(state, 0, 10, '+12', true);
    expect(state.floatingTexts.some((item) => item.active && item.text === '+12')).toBe(true);
    updateFeelVisuals(state, FEEL_CONFIG.floatingTextLife);
    expect(state.floatingTexts.some((item) => item.active)).toBe(false);
  });
});
