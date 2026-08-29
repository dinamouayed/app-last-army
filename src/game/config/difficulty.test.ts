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
  chargerSpawnChance,
  scaledEnemyApproachSpeed,
  enemyGroupBounds,
  waveGroupCount,
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
    expect(late.enemyGroupMax).toBeGreaterThan(early.enemyGroupMax);
    expect(late.waveGroupCount).toBeGreaterThan(early.waveGroupCount);
    expect(late.spawnInterval).toBeLessThan(early.spawnInterval);
    expect(late.bossHp).toBeGreaterThan(early.bossHp);
    expect(late.encounterComplexity).toBe(1);
  });

  it('keeps chargers locked until 1000 m and faster than basic enemies', () => {
    expect(chargerSpawnChance(0)).toBe(0);
    expect(chargerSpawnChance(999)).toBe(0);
    expect(chargerSpawnChance(1000)).toBeGreaterThan(0);
    expect(scaledEnemyApproachSpeed(0, ENEMIES.charger.approachSpeed)).toBeGreaterThan(
      scaledEnemyApproachSpeed(0, ENEMIES.basic.approachSpeed),
    );
    expect(scaledEnemyApproachSpeed(1600, ENEMIES.charger.approachSpeed)).toBeGreaterThan(
      scaledEnemyApproachSpeed(1600, ENEMIES.basic.approachSpeed),
    );
  });

  it('scales enemy group size with distance up to a late-game cap', () => {
    const early = enemyGroupBounds(0);
    const mid = enemyGroupBounds(800);
    const around1200 = enemyGroupBounds(1200);
    const around1500 = enemyGroupBounds(1500);
    const late = enemyGroupBounds(2000);
    const pastCap = enemyGroupBounds(4000);

    expect(early.min).toBe(1);
    expect(early.max).toBe(2);
    expect(mid.min).toBeGreaterThan(early.min);
    expect(mid.max).toBeGreaterThan(early.max);
    expect(around1200.max).toBeLessThan(late.max);
    expect(around1500.max).toBeLessThanOrEqual(late.max);
    expect(around1500.max).toBeLessThan(9);
    expect(late.min).toBe(6);
    expect(late.max).toBe(8);
    expect(pastCap).toEqual(late);
    expect(waveGroupCount(0)).toBe(1);
    expect(waveGroupCount(1200)).toBeLessThan(waveGroupCount(2000));
    expect(waveGroupCount(2000)).toBe(5);
    expect(scaledSpawnInterval(0)).toBeGreaterThan(scaledSpawnInterval(2000));
  });
});
