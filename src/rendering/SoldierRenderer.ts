import type { SkCanvas } from '@shopify/react-native-skia';

import { GAME_CONFIG } from '../game/config/game';
import { playerWorldZ, worldToScreen } from '../game/math/camera';
import type { ScreenPoint } from '../game/types';
import type { RenderResources } from './paints';

export interface SoldierPose {
  worldX: number;
  worldZ: number;
  elapsed: number;
  stridePhase?: number;
  lean?: number;
}

function drawSoldierLocal(
  canvas: SkCanvas,
  resources: RenderResources,
  elapsed: number,
  stridePhase: number,
  lean: number,
): void {
  const run = elapsed * 11 + stridePhase;
  const bob = Math.sin(run) * 0.9;
  const left = Math.sin(run);
  const right = -left;

  resources.paints.soldierShadow.setAlphaf(0.28);
  canvas.drawOval(
    { x: -15, y: -4, width: 30, height: 8 },
    resources.paints.soldierShadow,
  );
  resources.paints.soldierShadow.setAlphaf(1);

  canvas.save();
  canvas.translate(lean * 7, bob);

  canvas.drawRect(
    { x: -7.5 + left * 1.1, y: -13 - left * 2.2, width: 6, height: 12 },
    resources.paints.soldierPants,
  );
  canvas.drawRect(
    { x: 1.5 + right * 1.1, y: -13 - right * 2.2, width: 6, height: 12 },
    resources.paints.soldierPants,
  );
  canvas.drawRect(
    { x: -8 + left * 1.1, y: -4 - left * 2.1, width: 7, height: 4 },
    resources.paints.soldierBoot,
  );
  canvas.drawRect(
    { x: 1 + right * 1.1, y: -4 - right * 2.1, width: 7, height: 4 },
    resources.paints.soldierBoot,
  );

  canvas.drawRect(
    { x: -10, y: -30, width: 20, height: 18 },
    resources.paints.soldierUniform,
  );
  canvas.drawRect(
    { x: -9, y: -28, width: 18, height: 8 },
    resources.paints.soldierUniformDark,
  );
  canvas.drawRect(
    { x: -12, y: -27, width: 5, height: 7 },
    resources.paints.soldierUniformDark,
  );
  canvas.drawRect(
    { x: 7, y: -27, width: 5, height: 7 },
    resources.paints.soldierUniformDark,
  );

  canvas.drawRect(
    { x: 3.6, y: -48, width: 3.6, height: 28 },
    resources.paints.soldierGun,
  );
  canvas.drawRect(
    { x: 2.6, y: -52, width: 5.6, height: 5 },
    resources.paints.soldierGunMetal,
  );
  canvas.drawRect(
    { x: 6.2, y: -50, width: 8, height: 2.4 },
    resources.paints.soldierGunMetal,
  );
  canvas.drawRect(
    { x: 2.8, y: -32, width: 5.2, height: 4 },
    resources.paints.soldierGun,
  );

  canvas.drawCircle(0, -35, 7.4, resources.paints.soldierSkin);
  canvas.drawRect(
    { x: -9.5, y: -49, width: 19, height: 16 },
    resources.paints.soldierHelmet,
  );
  canvas.drawRect(
    { x: -10.2, y: -38, width: 20.4, height: 3.2 },
    resources.paints.soldierHelmet,
  );
  canvas.drawRect(
    { x: -7, y: -41.5, width: 14, height: 2 },
    resources.paints.soldierGunMetal,
  );

  canvas.restore();
}

export function drawSoldier(
  canvas: SkCanvas,
  resources: RenderResources,
  point: ScreenPoint,
  elapsed: number,
  options?: { stridePhase?: number; lean?: number },
): void {
  canvas.save();
  canvas.translate(point.screenX, point.screenY);
  canvas.scale(
    point.scale * GAME_CONFIG.soldierDrawScale,
    point.scale * GAME_CONFIG.soldierDrawScale,
  );
  drawSoldierLocal(
    canvas,
    resources,
    elapsed,
    options?.stridePhase ?? 0,
    options?.lean ?? 0,
  );
  canvas.restore();
}

export function drawSoldierAt(
  canvas: SkCanvas,
  resources: RenderResources,
  pose: SoldierPose,
  cameraZ: number,
  width: number,
  height: number,
): void {
  const point = worldToScreen(
    pose.worldX,
    pose.worldZ,
    cameraZ,
    width,
    height,
    GAME_CONFIG.camera,
  );
  drawSoldier(canvas, resources, point, pose.elapsed, {
    stridePhase: pose.stridePhase,
    lean: pose.lean,
  });
}

export function drawCombatSilhouette(
  canvas: SkCanvas,
  resources: RenderResources,
  worldX: number,
  worldZ: number,
  cameraZ: number,
  width: number,
  height: number,
): void {
  const point = worldToScreen(
    worldX,
    worldZ,
    cameraZ,
    width,
    height,
    GAME_CONFIG.camera,
  );
  canvas.save();
  canvas.translate(point.screenX, point.screenY);
  canvas.scale(point.scale, point.scale);
  resources.paints.silhouette.setAlphaf(0.55);
  canvas.drawOval({ x: -10, y: -5, width: 20, height: 7 }, resources.paints.soldierShadow);
  canvas.drawRect({ x: -7, y: -22, width: 14, height: 16 }, resources.paints.silhouette);
  canvas.drawRect({ x: -6, y: -32, width: 12, height: 10 }, resources.paints.silhouette);
  resources.paints.silhouette.setAlphaf(1);
  canvas.restore();
}

export function playerPose(
  armyX: number,
  cameraZ: number,
  elapsed: number,
  lean: number,
): SoldierPose {
  return {
    worldX: armyX,
    worldZ: playerWorldZ(cameraZ, GAME_CONFIG.camera),
    elapsed,
    lean,
  };
}
