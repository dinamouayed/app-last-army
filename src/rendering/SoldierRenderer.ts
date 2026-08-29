import type { SkCanvas, SkPaint } from '@shopify/react-native-skia';

import { GAME_CONFIG } from '../game/config/game';
import { playerWorldZ, worldToScreen } from '../game/math/camera';
import type { ScreenPoint } from '../game/types';
import type { RenderResources } from './paints';

export type SoldierKit = 'player' | 'enemy' | 'charger';

export const SOLDIER_MUZZLE = {
  localX: 14,
  localY: -51,
} as const;

export interface SoldierPose {
  worldX: number;
  worldZ: number;
  elapsed: number;
  stridePhase?: number;
  lean?: number;
  kit?: SoldierKit;
  muzzleFlash?: number;
}

interface SoldierPaints {
  uniform: SkPaint;
  uniformDark: SkPaint;
  pants: SkPaint;
  helmet: SkPaint;
}

function paintsForKit(resources: RenderResources, kit: SoldierKit): SoldierPaints {
  if (kit === 'charger') {
    return {
      uniform: resources.paints.chargerUniform,
      uniformDark: resources.paints.chargerUniformDark,
      pants: resources.paints.chargerPants,
      helmet: resources.paints.chargerHelmet,
    };
  }
  if (kit === 'enemy') {
    return {
      uniform: resources.paints.enemyUniform,
      uniformDark: resources.paints.enemyUniformDark,
      pants: resources.paints.enemyPants,
      helmet: resources.paints.enemyHelmet,
    };
  }
  return {
    uniform: resources.paints.soldierUniform,
    uniformDark: resources.paints.soldierUniformDark,
    pants: resources.paints.soldierPants,
    helmet: resources.paints.soldierHelmet,
  };
}

export function muzzleScreenLift(scale: number, visualScale = 1): number {
  return Math.abs(SOLDIER_MUZZLE.localY) * GAME_CONFIG.soldierDrawScale * visualScale * scale;
}

function drawSoldierLocal(
  canvas: SkCanvas,
  resources: RenderResources,
  elapsed: number,
  stridePhase: number,
  lean: number,
  kit: SoldierKit,
  muzzleFlash: number,
): void {
  const run = elapsed * 11 + stridePhase;
  const bob = Math.sin(run) * 0.9;
  const left = Math.sin(run);
  const right = -left;
  const kitPaints = paintsForKit(resources, kit);
  const recoil = muzzleFlash > 0 ? Math.min(1, muzzleFlash * 16) * 1.15 : 0;

  resources.paints.soldierShadow.setAlphaf(0.28);
  canvas.drawOval(
    { x: -15, y: -4, width: 30, height: 8 },
    resources.paints.soldierShadow,
  );
  resources.paints.soldierShadow.setAlphaf(1);

  canvas.save();
  canvas.translate(lean * 7, bob + recoil);

  canvas.drawRect(
    { x: -7.5 + left * 1.1, y: -13 - left * 2.2, width: 6, height: 12 },
    kitPaints.pants,
  );
  canvas.drawRect(
    { x: 1.5 + right * 1.1, y: -13 - right * 2.2, width: 6, height: 12 },
    kitPaints.pants,
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
    kitPaints.uniform,
  );
  canvas.drawRect(
    { x: -9, y: -28, width: 18, height: 8 },
    kitPaints.uniformDark,
  );
  canvas.drawRect(
    { x: -12, y: -27, width: 5, height: 7 },
    kitPaints.uniformDark,
  );
  canvas.drawRect(
    { x: 7, y: -27, width: 5, height: 7 },
    kitPaints.uniformDark,
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

  if (muzzleFlash > 0) {
    const flash = Math.min(1, muzzleFlash / 0.06);
    resources.paints.muzzleFlash.setAlphaf(0.55 + flash * 0.45);
    canvas.drawOval(
      { x: 10.5, y: -54, width: 15, height: 8 },
      resources.paints.muzzleFlash,
    );
    resources.paints.muzzleCore.setAlphaf(0.7 + flash * 0.3);
    canvas.drawOval(
      { x: 14, y: -52.6, width: 8, height: 4.6 },
      resources.paints.muzzleCore,
    );
    resources.paints.muzzleFlash.setAlphaf(1);
    resources.paints.muzzleCore.setAlphaf(1);
  }

  canvas.drawCircle(0, -35, 7.4, resources.paints.soldierSkin);
  canvas.drawRect(
    { x: -9.5, y: -49, width: 19, height: 16 },
    kitPaints.helmet,
  );
  canvas.drawRect(
    { x: -10.2, y: -38, width: 20.4, height: 3.2 },
    kitPaints.helmet,
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
  options?: {
    stridePhase?: number;
    lean?: number;
    kit?: SoldierKit;
    muzzleFlash?: number;
    alpha?: number;
    scaleMul?: number;
  },
): void {
  const alpha = options?.alpha ?? 1;
  const scaleMul = options?.scaleMul ?? 1;
  if (alpha <= 0.01) {
    return;
  }

  canvas.save();
  canvas.translate(point.screenX, point.screenY);
  const drawScale = point.scale * GAME_CONFIG.soldierDrawScale * scaleMul;
  canvas.scale(drawScale, drawScale);
  if (alpha < 0.999) {
    resources.paints.soldierShadow.setAlphaf(alpha);
    resources.paints.soldierBoot.setAlphaf(alpha);
    resources.paints.soldierGun.setAlphaf(alpha);
    resources.paints.soldierGunMetal.setAlphaf(alpha);
    resources.paints.soldierSkin.setAlphaf(alpha);
    resources.paints.soldierUniform.setAlphaf(alpha);
    resources.paints.soldierUniformDark.setAlphaf(alpha);
    resources.paints.soldierPants.setAlphaf(alpha);
    resources.paints.soldierHelmet.setAlphaf(alpha);
    resources.paints.enemyUniform.setAlphaf(alpha);
    resources.paints.enemyUniformDark.setAlphaf(alpha);
    resources.paints.enemyPants.setAlphaf(alpha);
    resources.paints.enemyHelmet.setAlphaf(alpha);
    resources.paints.chargerUniform.setAlphaf(alpha);
    resources.paints.chargerUniformDark.setAlphaf(alpha);
    resources.paints.chargerPants.setAlphaf(alpha);
    resources.paints.chargerHelmet.setAlphaf(alpha);
    resources.paints.muzzleFlash.setAlphaf(alpha);
    resources.paints.muzzleCore.setAlphaf(alpha);
  }
  drawSoldierLocal(
    canvas,
    resources,
    elapsed,
    options?.stridePhase ?? 0,
    options?.lean ?? 0,
    options?.kit ?? 'player',
    options?.muzzleFlash ?? 0,
  );
  if (alpha < 0.999) {
    resources.paints.soldierShadow.setAlphaf(1);
    resources.paints.soldierBoot.setAlphaf(1);
    resources.paints.soldierGun.setAlphaf(1);
    resources.paints.soldierGunMetal.setAlphaf(1);
    resources.paints.soldierSkin.setAlphaf(1);
    resources.paints.soldierUniform.setAlphaf(1);
    resources.paints.soldierUniformDark.setAlphaf(1);
    resources.paints.soldierPants.setAlphaf(1);
    resources.paints.soldierHelmet.setAlphaf(1);
    resources.paints.enemyUniform.setAlphaf(1);
    resources.paints.enemyUniformDark.setAlphaf(1);
    resources.paints.enemyPants.setAlphaf(1);
    resources.paints.enemyHelmet.setAlphaf(1);
    resources.paints.chargerUniform.setAlphaf(1);
    resources.paints.chargerUniformDark.setAlphaf(1);
    resources.paints.chargerPants.setAlphaf(1);
    resources.paints.chargerHelmet.setAlphaf(1);
    resources.paints.muzzleFlash.setAlphaf(1);
    resources.paints.muzzleCore.setAlphaf(1);
  }
  canvas.restore();
}

export function drawSoldierAt(
  canvas: SkCanvas,
  resources: RenderResources,
  pose: SoldierPose,
  cameraZ: number,
  width: number,
  height: number,
  options?: {
    alpha?: number;
    scaleMul?: number;
  },
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
    kit: pose.kit,
    muzzleFlash: pose.muzzleFlash,
    alpha: options?.alpha,
    scaleMul: options?.scaleMul,
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
  muzzleFlash = 0,
): SoldierPose {
  return {
    worldX: armyX,
    worldZ: playerWorldZ(cameraZ, GAME_CONFIG.camera),
    elapsed,
    lean,
    muzzleFlash,
  };
}

export function formationPose(
  worldX: number,
  worldZ: number,
  elapsed: number,
  lean: number,
  stridePhase: number,
  muzzleFlash = 0,
): SoldierPose {
  return {
    worldX,
    worldZ,
    elapsed,
    lean,
    stridePhase,
    muzzleFlash,
  };
}
