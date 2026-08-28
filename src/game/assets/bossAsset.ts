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
    { x: 0, y: 0, w: 512, h: 512 },
  ],
  windup: [
    { x: 0, y: 512, w: 512, h: 512 },
    { x: 0, y: 1024, w: 512, h: 512 },
    { x: 0, y: 1536, w: 512, h: 512 },
  ],
  slam: [
    { x: 0, y: 2048, w: 512, h: 512 },
    { x: 0, y: 2560, w: 512, h: 512 },
  ],
  recover: [
    { x: 0, y: 3072, w: 512, h: 512 },
    { x: 0, y: 3584, w: 512, h: 512 },
  ],
} as const satisfies Record<string, readonly BossFrameRect[]>;
