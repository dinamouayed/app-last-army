import { describe, expect, it } from '@jest/globals';

import { formatDistance, isGameOver } from './format';

describe('formatDistance', () => {
  it('formats whole meters with grouping separators', () => {
    expect(formatDistance(2847.9)).toBe('2,847');
  });

  it('never shows a negative distance', () => {
    expect(formatDistance(-10)).toBe('0');
  });
});

describe('isGameOver', () => {
  it('ends the run only when the army is gone', () => {
    expect(isGameOver(1)).toBe(false);
    expect(isGameOver(0)).toBe(true);
    expect(isGameOver(-3)).toBe(true);
  });
});
