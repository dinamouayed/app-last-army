import { describe, expect, it } from '@jest/globals';

import { GAME_CONFIG } from '../config/game';
import { worldToScreen } from './camera';

const WIDTH = 390;
const HEIGHT = 844;
const CAMERA_Z = 100;
const { camera } = GAME_CONFIG;

describe('worldToScreen', () => {
  const player = worldToScreen(
    0,
    CAMERA_Z + camera.playerDepth,
    CAMERA_Z,
    WIDTH,
    HEIGHT,
    camera,
  );
  const far = worldToScreen(
    0,
    CAMERA_Z + camera.zFar,
    CAMERA_Z,
    WIDTH,
    HEIGHT,
    camera,
  );
  const clip = worldToScreen(
    0,
    CAMERA_Z + camera.zClip,
    CAMERA_Z,
    WIDTH,
    HEIGHT,
    camera,
  );
  const nearLeft = worldToScreen(
    -1,
    CAMERA_Z + camera.playerDepth,
    CAMERA_Z,
    WIDTH,
    HEIGHT,
    camera,
  );
  const farLeft = worldToScreen(
    -1,
    CAMERA_Z + camera.zFar,
    CAMERA_Z,
    WIDTH,
    HEIGHT,
    camera,
  );
  const nearRight = worldToScreen(
    1,
    CAMERA_Z + camera.playerDepth,
    CAMERA_Z,
    WIDTH,
    HEIGHT,
    camera,
  );

  it('places the player in the lower portion of the screen', () => {
    expect(player.screenY).toBeGreaterThan(HEIGHT * 0.68);
    expect(player.screenY).toBeLessThan(HEIGHT * 0.84);
  });

  it('places near objects lower on screen than far objects', () => {
    expect(player.screenY).toBeGreaterThan(far.screenY);
  });

  it('makes near objects larger than far objects', () => {
    expect(player.scale).toBeGreaterThan(far.scale);
    expect(player.scale).toBeCloseTo(1, 5);
  });

  it('extends the road below the bottom of the screen instead of folding it', () => {
    expect(clip.screenY).toBeGreaterThan(HEIGHT);
  });

  it('keeps the center lane on the horizontal midpoint', () => {
    expect(player.screenX).toBeCloseTo(WIDTH / 2, 5);
    expect(far.screenX).toBeCloseTo(WIDTH / 2, 5);
  });

  it('converges far lanes toward the vanishing point', () => {
    const nearOffset = Math.abs(nearLeft.screenX - WIDTH / 2);
    const farOffset = Math.abs(farLeft.screenX - WIDTH / 2);
    expect(farOffset).toBeLessThan(nearOffset);
  });

  it('places the left lane left of the right lane', () => {
    expect(nearLeft.screenX).toBeLessThan(nearRight.screenX);
  });
});
