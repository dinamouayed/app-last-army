import { describe, expect, it } from '@jest/globals';

import {
  BOSS_CONFIG,
  bossTapFireballAppliedDamage,
  bossTapFireballDamage,
} from '../config/bosses';
import { GameSession } from '../engine/GameSession';
import { createGameState } from '../engine/GameState';
import { spawnBoss } from './BossSystem';
import {
  launchTapFireball,
  registerBossTap,
  updateBossTapStrike,
} from './BossTapStrikeSystem';

function mashUntilFireball(state: ReturnType<typeof createGameState>): void {
  for (let i = 0; i < 40; i += 1) {
    registerBossTap(state);
    if (state.tapStrike.fireballActive) {
      return;
    }
  }
}

describe('boss tap fireball', () => {
  it('deals a quarter of the boss initial HP and never finishes the fight', () => {
    expect(bossTapFireballDamage(2000)).toBe(500);
    expect(bossTapFireballAppliedDamage(2000, 2000)).toBe(500);
    expect(bossTapFireballAppliedDamage(400, 2000)).toBe(399);
    expect(bossTapFireballAppliedDamage(1, 2000)).toBe(0);
  });

  it('ignores taps when no boss is present', () => {
    const state = createGameState();
    expect(registerBossTap(state)).toBe(false);
    expect(state.tapStrike.charge).toBe(0);
  });

  it('grows charge with each tap during a boss fight', () => {
    const state = createGameState();
    spawnBoss(state);
    expect(registerBossTap(state)).toBe(true);
    expect(state.tapStrike.charge).toBeCloseTo(BOSS_CONFIG.tapChargePerTap);
    registerBossTap(state);
    expect(state.tapStrike.charge).toBeCloseTo(BOSS_CONFIG.tapChargePerTap * 2);
    for (let i = 0; i < 8; i += 1) {
      registerBossTap(state);
    }
    expect(state.tapStrike.fireballActive).toBe(false);
    expect(state.tapStrike.charge).toBeLessThan(1);
  });

  it('ignores a tap that arrives too slowly after the previous one', () => {
    const state = createGameState();
    spawnBoss(state);
    expect(registerBossTap(state)).toBe(true);
    const afterFirst = state.tapStrike.charge;
    state.elapsed += BOSS_CONFIG.tapMaxGap + 0.05;
    expect(registerBossTap(state)).toBe(false);
    expect(state.tapStrike.charge).toBeCloseTo(afterFirst);
  });

  it('decays charge if the player stops mashing', () => {
    const state = createGameState();
    spawnBoss(state);
    registerBossTap(state);
    updateBossTapStrike(state, BOSS_CONFIG.tapChargeIdleGrace);
    const charged = state.tapStrike.charge;
    updateBossTapStrike(state, 0.4);
    expect(state.tapStrike.charge).toBeLessThan(charged);
  });

  it('launches a fireball when the circle fills and slams the boss', () => {
    const state = createGameState();
    spawnBoss(state);
    const startHp = state.boss.hp;
    mashUntilFireball(state);
    expect(state.tapStrike.fireballActive).toBe(true);
    expect(state.tapStrike.charge).toBe(0);

    updateBossTapStrike(state, BOSS_CONFIG.tapFireballFlight);
    expect(state.tapStrike.fireballActive).toBe(false);
    expect(state.boss.hp).toBe(
      startHp - bossTapFireballAppliedDamage(startHp, state.boss.maxHp),
    );
    expect(state.boss.dying).toBe(false);
    expect(state.tapStrike.impactT).toBeGreaterThan(0);
    expect(state.boss.hitFlash).toBeGreaterThan(0);
  });

  it('does not let the fireball kill a wounded boss', () => {
    const state = createGameState();
    spawnBoss(state);
    state.boss.hp = Math.min(40, state.boss.maxHp);
    launchTapFireball(state);
    updateBossTapStrike(state, BOSS_CONFIG.tapFireballFlight);
    expect(state.boss.dying).toBe(false);
    expect(state.boss.hp).toBe(1);
  });

  it('does not count a swipe as a tap', () => {
    const session = new GameSession();
    spawnBoss(session.state);
    session.beginSwipe();
    session.updateSwipe(80);
    session.endSwipe();
    expect(session.state.tapStrike.charge).toBe(0);
    expect(session.state.targetLane).toBe(2);
  });

  it('counts a short tap without movement', () => {
    const session = new GameSession();
    spawnBoss(session.state);
    session.beginSwipe();
    session.endSwipe();
    expect(session.state.tapStrike.charge).toBeCloseTo(BOSS_CONFIG.tapChargePerTap);
    expect(session.state.targetLane).toBe(1);
  });

  it('does not count a long press as a tap', () => {
    const session = new GameSession();
    spawnBoss(session.state);
    session.beginSwipe();
    session.state.elapsed += BOSS_CONFIG.tapMaxDuration + 0.05;
    session.endSwipe();
    expect(session.state.tapStrike.charge).toBe(0);
  });
});
