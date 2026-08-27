import { describe, expect, it } from '@jest/globals';

import { applyGateArithmetic, generateGateChoices } from './GateGenerator';

describe('applyGateArithmetic', () => {
  it('adds, subtracts and multiplies with a zero floor', () => {
    expect(applyGateArithmetic(20, 'add', 15)).toBe(35);
    expect(applyGateArithmetic(20, 'subtract', 8)).toBe(12);
    expect(applyGateArithmetic(20, 'multiply', 2)).toBe(40);
    expect(applyGateArithmetic(3, 'subtract', 8)).toBe(0);
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

describe('generateGateChoices', () => {
  it('returns 2 or 3 lane choices', () => {
    for (let i = 0; i < 24; i += 1) {
      const choices = generateGateChoices(12, ['pistol'], 100, () => (i * 0.17) % 1);
      expect(choices.length).toBeGreaterThanOrEqual(2);
      expect(choices.length).toBeLessThanOrEqual(3);
    }
  });

  it('always leaves at least one survivable lane', () => {
    for (let armySize = 1; armySize <= 30; armySize += 1) {
      for (let seed = 0; seed < 12; seed += 1) {
        const rng = () => ((armySize * 17 + seed * 31) % 997) / 997;
        const choices = generateGateChoices(armySize, ['pistol'], armySize * 10, rng);
        const survivable = choices.some((choice) => isSurvivableChoice(armySize, choice));
        expect(survivable).toBe(true);
      }
    }
  });

  it('uses distinct lanes within a choice set', () => {
    const choices = generateGateChoices(10, ['pistol'], 50, () => 0.42);
    const lanes = choices.map((choice) => choice.lane);
    expect(new Set(lanes).size).toBe(lanes.length);
  });

  it('can include a weapon barrel among math gates', () => {
    let found = false;
    for (let i = 0; i < 80; i += 1) {
      const choices = generateGateChoices(20, ['pistol'], 200, () => (i * 0.13) % 1);
      if (choices.some((choice) => choice.kind === 'weapon')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('recovery mode only offers survivable positive math', () => {
    for (let i = 0; i < 24; i += 1) {
      const choices = generateGateChoices(3, ['pistol'], 80, () => (i * 0.19) % 1, 'recovery');
      expect(choices.length).toBeGreaterThanOrEqual(2);
      for (const choice of choices) {
        expect(choice.kind).toBe('math');
        expect(choice.shootable).toBeFalsy();
        expect(choice.operation === 'add' || choice.operation === 'multiply').toBe(true);
        expect(applyGateArithmetic(3, choice.operation!, choice.value!)).toBeGreaterThan(0);
      }
    }
  });

  it('weapon mode includes a barrel gate', () => {
    const choices = generateGateChoices(12, ['pistol'], 200, () => 0.11, 'weapon');
    expect(choices.some((choice) => choice.kind === 'weapon')).toBe(true);
  });
});
