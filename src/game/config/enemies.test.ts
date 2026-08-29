import { describe, expect, it } from '@jest/globals';

import { ARMY_CONFIG } from './army';
import { ENEMY_DRAW, ENEMIES, enemyContactDamage, enemyDrawScaleMul, enemyPerspectiveScale } from './enemies';
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

describe('enemy draw scale', () => {
  it('leaves far perspective alone and compresses the last stretch', () => {
    expect(enemyPerspectiveScale(0.2)).toBe(0.2);
    expect(enemyPerspectiveScale(0.4)).toBe(0.4);
    expect(enemyPerspectiveScale(1)).toBeLessThan(0.7);
    expect(enemyPerspectiveScale(1)).toBeGreaterThan(ENEMY_DRAW.nearScaleCap); 
  });

  it('keeps close reds only a bit larger than player soldiers', () => {
    const closeMul = enemyDrawScaleMul('basic', 1);
    expect(closeMul).toBeGreaterThan(ARMY_CONFIG.visualScale);
    expect(closeMul).toBeLessThan(ARMY_CONFIG.visualScale * 1.4);
  });

  it('does not shrink approaching reds relative to their base scale', () => {
    expect(enemyDrawScaleMul('basic', 0.2)).toBeCloseTo(ENEMIES.basic.visualScale, 5);
  });
});
