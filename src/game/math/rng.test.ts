import { describe, expect, it } from '@jest/globals';

import { createRng, nextMulberry32 } from './rng';

describe('seeded rng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const first = [a(), a(), a(), a()];
    const second = [b(), b(), b(), b()];
    expect(first).toEqual(second);
  });

  it('diverges for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('stays in [0, 1)', () => {
    const box = { rngState: 99 };
    for (let i = 0; i < 200; i += 1) {
      const value = nextMulberry32(box);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
