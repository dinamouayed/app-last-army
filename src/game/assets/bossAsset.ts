/** Generated from assets/boss/source-sheet.jpg (user sprite sheet). */
export const BOSS_ATLAS = require('../../../assets/boss/boss-atlas.png');

export interface BossFrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const BOSS_CELL = { w: 205, h: 211 } as const;

export const BOSS_FRAMES = {
  idle: [
    { x: 0, y: 0, w: 205, h: 211 },
    { x: 0, y: 211, w: 205, h: 211 },
    { x: 0, y: 422, w: 205, h: 211 },
    { x: 0, y: 633, w: 205, h: 211 },
    { x: 0, y: 844, w: 205, h: 211 },
    { x: 0, y: 1055, w: 205, h: 211 },
  ],
  windup: [
    { x: 0, y: 1266, w: 205, h: 211 },
    { x: 0, y: 1477, w: 205, h: 211 },
    { x: 0, y: 1688, w: 205, h: 211 },
    { x: 0, y: 1899, w: 205, h: 211 },
  ],
  slam: [
    { x: 0, y: 2110, w: 205, h: 211 },
    { x: 0, y: 2321, w: 205, h: 211 },
    { x: 0, y: 2532, w: 205, h: 211 },
    { x: 0, y: 2743, w: 205, h: 211 },
    { x: 0, y: 2954, w: 205, h: 211 },
  ],
  recover: [
    { x: 0, y: 3165, w: 205, h: 211 },
    { x: 0, y: 3376, w: 205, h: 211 },
    { x: 0, y: 3587, w: 205, h: 211 },
    { x: 0, y: 3798, w: 205, h: 211 },
  ],
} as const satisfies Record<string, readonly BossFrameRect[]>;
