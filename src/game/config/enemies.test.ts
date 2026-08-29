import { describe, expect, it } from '@jest/globals';

import { ENEMIES, enemyContactDamage } from './enemies';
import {
  chargerSpawnChance,
  difficultyFactor,
  difficultyProgress,
  getDifficultySnapshot,
  scaledEnemyApproachSpeed,
  scaledEnemyHp,
  scaledSpawnInterval,
  scaleGateValue,
  scaleShootableInitialValue,
  weaponUnlockCostMultiplier,
} from './difficulty';

describe('enemyContactDamage', () => {
  it('uses the flat floor on a small army', () => {
    expect(enemyContactDamage(1)).toBe(ENEMIES.basic.armyDamagePerAttack);
    expect(enemyContactDamage(10)).toBe(1);
    expect(enemyContactDamage(50)).toBe(1);
  });

  it('scales with army size once the crowd is large', () => {
    expect(enemyContactDamage(51)).toBe(2);
    expect(enemyContactDamage(100)).toBe(2);
    expect(enemyContactDamage(200)).toBe(4);
  });

  it('never exceeds the current army', () => {
    expect(enemyContactDamage(0)).toBe(0);
    expect(enemyContactDamage(3)).toBeLessThanOrEqual(3);
  });

  it('makes chargers hit harder than basic soldiers', () => {
    expect(enemyContactDamage(100, ENEMIES.charger)).toBeGreaterThan(enemyContactDamage(100, ENEMIES.basic));
    expect(enemyContactDamage(10, ENEMIES.charger)).toBe(ENEMIES.charger.armyDamagePerAttack);
  });
});
