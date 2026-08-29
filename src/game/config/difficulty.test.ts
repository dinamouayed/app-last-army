import { describe, expect, it } from '@jest/globals';

import { ENEMIES } from './enemies';
import {
  difficultyFactor,
  difficultyProgress,
  getDifficultySnapshot,
  scaledEnemyHp,
  scaledSpawnInterval,
  scaleGateValue,
  scaleShootableInitialValue,
  weaponUnlockCostMultiplier,
} from './difficulty';

describe('difficulty scaling', () => {
  it('starts at the base values', () => {
    expect(difficultyFactor(0)).toBe(1);
    expect(difficultyProgress(0)).toBe(0);
    expect(scaledEnemyHp(0)).toBe(ENEMIES.basic.maxHp);
    expect(scaleGateValue('add', 10, 0)).toBe(10);
    expect(scaleGateValue('multiply', 2, 900)).toBe(2);
    expect(scaleGateValue('divide', 2, 900)).toBe(2);
    expect(weaponUnlockCostMultiplier(0)).toBe(1);
  });

  it('increases enemy HP, spawn pressure and gate values with distance', () => {
    expect(scaledEnemyHp(1600)).toBeGreaterThan(scaledEnemyHp(0));
    expect(scaledSpawnInterval(1600)).toBeLessThan(scaledSpawnInterval(0));
    expect(scaleGateValue('add', 10, 1600)).toBeGreaterThan(10);
    expect(scaleGateValue('subtract', 8, 1600)).toBeGreaterThan(8);
    expect(Math.abs(scaleShootableInitialValue(-10, 1600))).toBeGreaterThan(10);
    expect(weaponUnlockCostMultiplier(500)).toBeGreaterThan(1);
  });

  it('keeps early-game progress gentle', () => {
    expect(difficultyProgress(200)).toBeLessThan(0.03);
    expect(scaledEnemyHp(200)).toBeLessThan(ENEMIES.basic.maxHp + 4);
  });

  it('exposes a centralized snapshot', () => {
    const late = getDifficultySnapshot(1600, 2);
    const early = getDifficultySnapshot(0, 0);
    expect(late.factor).toBeGreaterThan(early.factor);
    expect(late.enemyHp).toBeGreaterThan(early.enemyHp);
    expect(late.enemyApproachSpeed).toBeGreaterThan(early.enemyApproachSpeed);
    expect(late.enemyGroupMax).toBeGreaterThanOrEqual(early.enemyGroupMax);
    expect(late.spawnInterval).toBeLessThan(early.spawnInterval);
    expect(late.bossHp).toBeGreaterThan(early.bossHp);
    expect(late.encounterComplexity).toBe(1);
  });
});
