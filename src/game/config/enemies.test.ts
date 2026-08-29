import { describe, expect, it } from '@jest/globals';

import { ENEMIES, enemyContactDamage } from './enemies';

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
});
