/** Generated photorealistic boss atlas. */
export const BOSS_ATLAS = require('../../../assets/boss/boss-atlas.png');

export interface BossFrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const BOSS_CELL = { w: 256, h: 256 } as const;

export const BOSS_FRAMES = {
  idle: [
    { x: 0, y: 0, w: 1024, h: 1024 },
  ],
  windup: [
    { x: 1024, y: 0, w: 1024, h: 1024 },
    { x: 2048, y: 0, w: 1024, h: 1024 },
    { x: 3072, y: 0, w: 1024, h: 1024 },
  ],
  slam: [
    { x: 0, y: 1024, w: 1024, h: 1024 },
    { x: 1024, y: 1024, w: 1024, h: 1024 },
  ],
  recover: [
    { x: 2048, y: 1024, w: 1024, h: 1024 },
    { x: 3072, y: 1024, w: 1024, h: 1024 },
  ],
} as const satisfies Record<string, readonly BossFrameRect[]>;
