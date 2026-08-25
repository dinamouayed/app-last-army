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
    { x: 0, y: 0, w: 256, h: 256 },
  ],
  windup: [
    { x: 0, y: 256, w: 256, h: 256 },
    { x: 0, y: 512, w: 256, h: 256 },
    { x: 0, y: 768, w: 256, h: 256 },
  ],
  slam: [
    { x: 0, y: 1024, w: 256, h: 256 },
    { x: 0, y: 1280, w: 256, h: 256 },
  ],
  recover: [
    { x: 0, y: 1536, w: 256, h: 256 },
    { x: 0, y: 1792, w: 256, h: 256 },
  ],
} as const satisfies Record<string, readonly BossFrameRect[]>;
