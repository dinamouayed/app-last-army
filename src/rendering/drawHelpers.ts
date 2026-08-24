import type { SkCanvas, SkPaint, SkPath } from '@shopify/react-native-skia';

import { GAME_CONFIG } from '../game/config/game';
import { worldToScreen } from '../game/math/camera';
import type { ScreenPoint } from '../game/types';

export function project(
  worldX: number,
  worldZ: number,
  cameraZ: number,
  width: number,
  height: number,
): ScreenPoint {
  return worldToScreen(
    worldX,
    worldZ,
    cameraZ,
    width,
    height,
    GAME_CONFIG.camera,
  );
}

export function drawQuad(
  canvas: SkCanvas,
  path: SkPath,
  a: ScreenPoint,
  b: ScreenPoint,
  c: ScreenPoint,
  d: ScreenPoint,
  paint: SkPaint,
): void {
  path.rewind();
  path.moveTo(a.screenX, a.screenY);
  path.lineTo(b.screenX, b.screenY);
  path.lineTo(c.screenX, c.screenY);
  path.lineTo(d.screenX, d.screenY);
  path.close();
  canvas.drawPath(path, paint);
}

export function fade(paint: SkPaint, scale: number): void {
  const t = Math.max(0, Math.min(1, (scale - 0.08) / 0.72));
  paint.setAlphaf(0.32 + t * 0.68);
}

/** Environment props stay below gameplay contrast. */
export function fadeEnvironment(paint: SkPaint, scale: number): void {
  const t = Math.max(0, Math.min(1, (scale - 0.08) / 0.72));
  paint.setAlphaf(0.28 + t * 0.56);
}

/** Far structures wash toward haze. */
export function fadeDistant(paint: SkPaint, scale: number): void {
  const t = Math.max(0, Math.min(1, (scale - 0.08) / 0.5));
  paint.setAlphaf(0.16 + t * 0.42);
}

export function drawWorldQuad(
  canvas: SkCanvas,
  path: SkPath,
  cameraZ: number,
  width: number,
  height: number,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  x3: number,
  z3: number,
  paint: SkPaint,
): void {
  drawQuad(
    canvas,
    path,
    project(x0, z0, cameraZ, width, height),
    project(x1, z1, cameraZ, width, height),
    project(x2, z2, cameraZ, width, height),
    project(x3, z3, cameraZ, width, height),
    paint,
  );
}
