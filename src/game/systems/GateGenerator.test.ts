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

describe('generateGateChoices', () => {
  it('returns 2 or 3 lane choices', () => {
    for (let i = 0; i < 24; i += 1) {
      const choices = generateGateChoices(12, () => (i * 0.17) % 1);
      expect(choices.length).toBeGreaterThanOrEqual(2);
      expect(choices.length).toBeLessThanOrEqual(3);
    }
  });

  it('always leaves at least one survivable lane', () => {
    for (let armySize = 1; armySize <= 30; armySize += 1) {
      for (let seed = 0; seed < 12; seed += 1) {
        const rng = () => ((armySize * 17 + seed * 31) % 997) / 997;
        const choices = generateGateChoices(armySize, rng);
        const survivable = choices.some(
          (choice) => applyGateArithmetic(armySize, choice.operation, choice.value) > 0,
        );
        expect(survivable).toBe(true);
      }
    }
  });

  it('uses distinct lanes within a choice set', () => {
    const choices = generateGateChoices(10, () => 0.42);
    const lanes = choices.map((choice) => choice.lane);
    expect(new Set(lanes).size).toBe(lanes.length);
  });
});
