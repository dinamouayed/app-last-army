import { describe, expect, it } from '@jest/globals';

import { BOSS_CONFIG } from '../config/bosses';
import { DIFFICULTY_CONFIG } from '../config/difficulty';
import { createGameState } from '../engine/GameState';
import { countActive } from '../entities/combat';
import { livingGateCount } from '../entities/gates';
import { killBoss } from './BossSystem';
import {
  activeSegments,
  currentSegment,
  debugQueueSegment,
  initWorld,
  updateWorld,
} from './WorldGenerator';

function kindsForSeed(seed: number): string[] {
  const state = createGameState(seed);
  return activeSegments(state).map((segment) => `${segment.kind}@${Math.round(segment.startDistance)}`);
}

describe('world generation', () => {
  it('is deterministic for a given seed', () => {
    expect(kindsForSeed(42)).toEqual(kindsForSeed(42));
    expect(kindsForSeed(42)).not.toEqual(kindsForSeed(99));
  });

  it('seeds the opening EnemyWave then GateChoice', () => {
    const state = createGameState(1);
    const live = activeSegments(state);
    expect(live[0]?.kind).toBe('EnemyWave');
    expect(live[0]?.startDistance).toBe(DIFFICULTY_CONFIG.opening[0]!.startDistance);
    expect(live[1]?.kind).toBe('GateChoice');
    expect(live[1]?.startDistance).toBe(DIFFICULTY_CONFIG.opening[1]!.startDistance);
  });

  it('keeps a lookahead of upcoming segments', () => {
    const state = createGameState(3);
    const live = activeSegments(state);
    expect(live.length).toBeGreaterThanOrEqual(3);
    expect(state.worldFrontier).toBeGreaterThan(state.distance + 120);
    const kinds = new Set(live.map((segment) => segment.kind));
    expect(kinds.has('BossApproach')).toBe(true);
  });

  it('materializes an EnemyWave ahead of the army', () => {
    const state = createGameState(1);
    debugQueueSegment(state, 'EnemyWave', 0, 60);
    updateWorld(state, 1 / 60, () => 0.5);
    expect(countActive(state.enemies)).toBeGreaterThan(0);
  });

  it('materializes a GateChoice as survivable lane options', () => {
    const state = createGameState(1);
    state.armySize = 8;
    debugQueueSegment(state, 'GateChoice', 0, 80);
    updateWorld(state, 0, () => 0.4);
    expect(livingGateCount(state.gates)).toBeGreaterThanOrEqual(2);
  });

  it('does not spawn combat encounters during BossApproach', () => {
    const state = createGameState(1);
    for (const segment of state.segments) {
      segment.active = false;
    }
    debugQueueSegment(state, 'BossApproach', 0, 90);
    updateWorld(state, 0, () => 0.5);
    expect(countActive(state.enemies)).toBe(0);
    expect(livingGateCount(state.gates)).toBe(0);
  });

  it('queues a RecoverySection after a boss dies', () => {
    const state = createGameState(1);
    state.distance = 40;
    state.boss.active = true;
    killBoss(state, state.boss);
    expect(state.pendingRecovery).toBe(true);
    state.boss.active = false;
    state.boss.dying = false;
    updateWorld(state, 0, () => 0.2);
    expect(state.segments.some((segment) => segment.active && segment.kind === 'RecoverySection')).toBe(true);
  });

  it('recycles segments behind the army', () => {
    const state = createGameState(1);
    const first = activeSegments(state)[0]!;
    const firstId = first.id;
    state.distance = first.startDistance + first.length + DIFFICULTY_CONFIG.recycleBehind + 4;
    updateWorld(state, 0);
    expect(state.segments.some((segment) => segment.active && segment.id === firstId)).toBe(false);
    expect(activeSegments(state).length).toBeGreaterThan(0);
  });

  it('reports the current segment kind', () => {
    const state = createGameState(1);
    state.distance = DIFFICULTY_CONFIG.opening[0]!.startDistance + 1;
    expect(currentSegment(state)?.kind).toBe('EnemyWave');
  });
});

describe('world fairness', () => {
  it('never schedules a gate-only death row in the opening lookahead', () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const state = createGameState(seed);
      expect(state.nextBossDistance).toBeGreaterThanOrEqual(BOSS_CONFIG.firstBossDistance);
      const live = activeSegments(state);
      expect(live.some((segment) => segment.kind === 'GateChoice' || segment.kind === 'RecoverySection')).toBe(
        true,
      );
    }
  });

  it('can rebuild lookahead after init', () => {
    const state = createGameState(4);
    const before = state.worldFrontier;
    initWorld(state);
    expect(state.worldFrontier).toBeGreaterThanOrEqual(before);
  });
});
