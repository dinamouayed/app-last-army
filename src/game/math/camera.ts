import type { CameraConfig, ScreenPoint } from '../types';

/**
 * Perspective projection for a flat ground plane.
 *
 * scale = 1 at the player. Closer depths fall below the player on screen
 * (and off the bottom), so the road never folds against a ground line.
 */
export function worldToScreen(
  worldX: number,
  worldZ: number,
  cameraZ: number,
  screenWidth: number,
  screenHeight: number,
  camera: CameraConfig,
): ScreenPoint {
  const depth = Math.max(worldZ - cameraZ, 0.05);
  const scale = camera.playerDepth / depth;
  const horizon = camera.horizonYRatio * screenHeight;
  const playerY = camera.playerYRatio * screenHeight;
  const screenY = horizon + (playerY - horizon) * scale;
  const roadHalfPx = screenWidth * camera.nearRoadHalfWidthRatio * scale;
  const screenX =
    screenWidth * 0.5 + (worldX / camera.roadHalfWidth) * roadHalfPx;

  return { screenX, screenY, scale };
}

export function horizonY(screenHeight: number, camera: CameraConfig): number {
  return camera.horizonYRatio * screenHeight;
}

export function playerScreenY(
  screenHeight: number,
  camera: CameraConfig,
): number {
  return camera.playerYRatio * screenHeight;
}

export function playerWorldZ(cameraZ: number, camera: CameraConfig): number {
  return cameraZ + camera.playerDepth;
}
