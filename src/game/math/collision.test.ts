import { describe, expect, it } from '@jest/globals';

import { segmentCircleHitT, segmentCircleHits } from './collision';

describe('segmentCircleHitT', () => {
  it('detects a point inside the circle', () => {
    expect(segmentCircleHits(0, 0, 0, 0, 0, 0, 0.5)).toBe(true);
  });

  it('detects a swept segment that crosses the circle', () => {
    const t = segmentCircleHitT(0, 0, 0, 4, 0, 2, 0.4);
    expect(t).not.toBeNull();
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(1);
  });

  it('misses a circle off to the side', () => {
    expect(segmentCircleHits(0, 0, 0, 4, 1.2, 2, 0.3)).toBe(false);
  });

  it('clamps to the segment ends', () => {
    expect(segmentCircleHits(0, 0, 0, 1, 0, 3, 0.4)).toBe(false);
    expect(segmentCircleHits(0, 0, 0, 1, 0, 0.2, 0.4)).toBe(true);
  });
});
