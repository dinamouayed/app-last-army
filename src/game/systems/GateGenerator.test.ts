import { describe, expect, it } from '@jest/globals';

import { createEmptyWeaponUpgradeTiers } from '../config/weapons';
import { applyGateArithmetic, generateGateChoices } from './GateGenerator';

describe('applyGateArithmetic', () => {
  it('adds, subtracts, multiplies and divides with a zero floor', () => {
    expect(applyGateArithmetic(20, 'add', 15)).toBe(35);
    expect(applyGateArithmetic(20, 'subtract', 8)).toBe(12);
    expect(applyGateArithmetic(20, 'multiply', 2)).toBe(40);
    expect(applyGateArithmetic(20, 'divide', 2)).toBe(10);
    expect(applyGateArithmetic(21, 'divide', 2)).toBe(10);
    expect(applyGateArithmetic(3, 'subtract', 8)).toBe(0);
    expect(applyGateArithmetic(1, 'divide', 2)).toBe(0);
  });
});

function isSurvivableChoice(
  armySize: number,
  choice: ReturnType<typeof generateGateChoices>[number],
): boolean {
  if (choice.kind === 'weapon' || choice.shootable) {
    return true;
  }
  return applyGateArithmetic(armySize, choice.operation!, choice.value!) > 0;
}

function generate(
  armySize: number,
  distance: number,
  rng: () => number,
  mode: Parameters<typeof generateGateChoices>[6] = 'standard',
) {
  return generateGateChoices(
    armySize,
    'pistol',
    ['pistol'],
    createEmptyWeaponUpgradeTiers(),
    distance,
    rng,
    mode,
  );
}

describe('generateGateChoices', () => {
  it('returns 2 or 3 lane choices', () => {
    for (let i = 0; i < 24; i += 1) {
      const choices = generate(12, 100, () => (i * 0.17) % 1);
      expect(choices.length).toBeGreaterThanOrEqual(2);
      expect(choices.length).toBeLessThanOrEqual(3);
    }
  });

  it('always leaves at least one survivable lane', () => {
    for (let armySize = 1; armySize <= 30; armySize += 1) {
      for (let seed = 0; seed < 12; seed += 1) {
        const rng = () => ((armySize * 17 + seed * 31) % 997) / 997;
        const choices = generate(armySize, armySize * 10, rng);
        const survivable = choices.some((choice) => isSurvivableChoice(armySize, choice));
        expect(survivable).toBe(true);
      }
    }
  });

  it('uses distinct lanes within a choice set', () => {
    const choices = generate(10, 50, () => 0.42);
    const lanes = choices.map((choice) => choice.lane);
    expect(new Set(lanes).size).toBe(lanes.length);
  });

  it('can include a weapon barrel among math gates', () => {
    let found = false;
    for (let i = 0; i < 80; i += 1) {
      const choices = generate(20, 200, () => (i * 0.13) % 1);
      if (choices.some((choice) => choice.kind === 'weapon')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('offers the next weapon in the cycle from the equipped weapon', () => {
    const choices = generateGateChoices(
      12,
      'machineGun',
      ['pistol', 'smg', 'shotgun', 'machineGun'],
      createEmptyWeaponUpgradeTiers(),
      200,
      () => 0.11,
      'weapon',
    );
    const weaponChoice = choices.find((choice) => choice.kind === 'weapon');
    expect(weaponChoice?.weaponId).toBe('pistol');
  });

  it('recovery mode only offers survivable positive math', () => {
    for (let i = 0; i < 24; i += 1) {
      const choices = generate(3, 80, () => (i * 0.19) % 1, 'recovery');
      expect(choices.length).toBeGreaterThanOrEqual(2);
      for (const choice of choices) {
        expect(choice.kind).toBe('math');
        expect(choice.shootable).toBeFalsy();
        expect(choice.operation === 'add' || choice.operation === 'multiply').toBe(true);
        expect(applyGateArithmetic(3, choice.operation!, choice.value!)).toBeGreaterThan(0);
      }
    }
  });

  it('can offer ÷2 once the army is large enough', () => {
    let found = false;
    for (let i = 0; i < 120; i += 1) {
      const choices = generate(40, 200, () => (i * 0.11) % 1);
      if (choices.some((choice) => choice.kind === 'math' && choice.operation === 'divide')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('does not offer divide gates to a tiny army', () => {
    for (let i = 0; i < 40; i += 1) {
      const choices = generate(4, 80, () => (i * 0.17) % 1);
      expect(choices.some((choice) => choice.operation === 'divide')).toBe(false);
    }
  });

  it('weapon mode includes a barrel gate', () => {
    const choices = generate(12, 200, () => 0.11, 'weapon');
    expect(choices.some((choice) => choice.kind === 'weapon')).toBe(true);
  });
});
