import { Skia, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';

import { GAME_CONFIG } from '../game/config/game';
import { horizonY } from '../game/math/camera';
import { hash01 } from '../game/math/hash';
import type {
  DistantDecoration,
  DistantKind,
  RoadsideDecoration,
  RoadsideKind,
} from '../game/world/decorationTypes';
import type { WorldDecorations } from '../game/world/EnvironmentSystem';
import { sortFarToNear } from '../game/world/EnvironmentSystem';
import type { ScreenPoint } from '../game/types';
import {
  drawWorldQuad,
  fadeDistant,
  fadeEnvironment,
  project,
} from './drawHelpers';
import type { RenderResources } from './paints';

function reset(paint: SkPaint): void {
  paint.setAlphaf(1);
}

export function drawSky(
  canvas: SkCanvas,
  resources: RenderResources,
  width: number,
  height: number,
): void {
  const skyBottom = horizonY(height, GAME_CONFIG.camera) + 6;
  canvas.drawRect(Skia.XYWHRect(0, 0, width, skyBottom), resources.paints.sky);
  canvas.drawRect(
    Skia.XYWHRect(0, skyBottom - 1, width, height - skyBottom + 1),
    resources.paints.ground,
  );

  resources.paints.skyWarm.setAlphaf(0.22);
  canvas.drawOval(
    Skia.XYWHRect(width * 0.28, skyBottom - 42, width * 0.5, 56),
    resources.paints.skyWarm,
  );
  reset(resources.paints.skyWarm);

  resources.paints.cloudDark.setAlphaf(0.2);
  canvas.drawOval(Skia.XYWHRect(width * 0.04, height * 0.05, 200, 36), resources.paints.cloudDark);
  canvas.drawOval(Skia.XYWHRect(width * 0.52, height * 0.03, 230, 40), resources.paints.cloudDark);
  canvas.drawOval(Skia.XYWHRect(width * 0.7, height * 0.08, 160, 28), resources.paints.cloudDark);
  reset(resources.paints.cloudDark);

  resources.paints.cloud.setAlphaf(0.26);
  canvas.drawOval(Skia.XYWHRect(width * 0.12, height * 0.07, 150, 24), resources.paints.cloud);
  canvas.drawOval(Skia.XYWHRect(width * 0.46, height * 0.045, 180, 26), resources.paints.cloud);
  canvas.drawOval(Skia.XYWHRect(width * 0.78, height * 0.1, 120, 20), resources.paints.cloud);
  reset(resources.paints.cloud);

  resources.paints.haze.setAlphaf(0.32);
  canvas.drawRect(Skia.XYWHRect(0, skyBottom - 22, width, 64), resources.paints.haze);
  reset(resources.paints.haze);
}

function terrainPaint(resources: RenderResources, tone: number): SkPaint {
  if (tone < 0.33) {
    return resources.paints.groundDark;
  }
  if (tone < 0.66) {
    return resources.paints.groundLight;
  }
  return resources.paints.gravel;
}

export function drawTerrain(
  canvas: SkCanvas,
  resources: RenderResources,
  decorations: WorldDecorations,
  cameraZ: number,
  width: number,
  height: number,
): void {
  for (const patch of decorations.terrain) {
    const paint = terrainPaint(resources, patch.tone);
    const point = project(patch.x, patch.z, cameraZ, width, height);
    paint.setAlphaf(0.28 + Math.min(0.45, point.scale * 0.4));
    const j = 0.18;
    const hw = patch.width * 0.5;
    const s = patch.seed;
    drawWorldQuad(
      canvas,
      resources.path,
      cameraZ,
      width,
      height,
      patch.x - hw + hash01(s) * j,
      patch.z,
      patch.x + hw - hash01(s + 2) * j,
      patch.z + hash01(s + 3) * 0.2,
      patch.x + hw + hash01(s + 4) * j,
      patch.z + patch.length,
      patch.x - hw - hash01(s + 6) * j,
      patch.z + patch.length + hash01(s + 7) * 0.2,
      paint,
    );
    reset(paint);
  }
}

function drawBarrier(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeEnvironment(resources.paints.barrier, s);
  fadeEnvironment(resources.paints.barrierDark, s);
  canvas.drawRect(
    { x: point.screenX - 15 * s, y: point.screenY - 17 * s, width: 30 * s, height: 17 * s },
    resources.paints.barrier,
  );
  canvas.drawRect(
    { x: point.screenX - 12 * s, y: point.screenY - 23 * s, width: 24 * s, height: 8 * s },
    resources.paints.barrierDark,
  );
  reset(resources.paints.barrier);
  reset(resources.paints.barrierDark);
}

function drawSandbags(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeEnvironment(resources.paints.sandbag, s);
  canvas.drawOval(
    { x: point.screenX - 16 * s, y: point.screenY - 8 * s, width: 15 * s, height: 8 * s },
    resources.paints.sandbag,
  );
  canvas.drawOval(
    { x: point.screenX - 2 * s, y: point.screenY - 8 * s, width: 15 * s, height: 8 * s },
    resources.paints.sandbag,
  );
  canvas.drawOval(
    { x: point.screenX - 9 * s, y: point.screenY - 14 * s, width: 16 * s, height: 8 * s },
    resources.paints.sandbag,
  );
  reset(resources.paints.sandbag);
}

function drawCrate(
  canvas: SkCanvas,
  resources: RenderResources,
  point: ScreenPoint,
  seed: number,
): void {
  const s = point.scale;
  const paint = hash01(seed) > 0.45 ? resources.paints.crateGreen : resources.paints.crate;
  fadeEnvironment(paint, s);
  canvas.drawRect(
    { x: point.screenX - 11 * s, y: point.screenY - 18 * s, width: 22 * s, height: 18 * s },
    paint,
  );
  fadeEnvironment(resources.paints.crate, s);
  canvas.drawRect(
    { x: point.screenX - 11 * s, y: point.screenY - 10 * s, width: 22 * s, height: 2 * s },
    resources.paints.crate,
  );
  reset(paint);
  reset(resources.paints.crate);
}

function drawBarrel(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeEnvironment(resources.paints.barrel, s);
  fadeEnvironment(resources.paints.metal, s);
  canvas.drawOval(
    { x: point.screenX - 7 * s, y: point.screenY - 20 * s, width: 14 * s, height: 7 * s },
    resources.paints.metal,
  );
  canvas.drawRect(
    { x: point.screenX - 7 * s, y: point.screenY - 16 * s, width: 14 * s, height: 14 * s },
    resources.paints.barrel,
  );
  canvas.drawOval(
    { x: point.screenX - 7 * s, y: point.screenY - 6 * s, width: 14 * s, height: 7 * s },
    resources.paints.barrel,
  );
  reset(resources.paints.barrel);
  reset(resources.paints.metal);
}

function drawRubble(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeEnvironment(resources.paints.rubble, s);
  fadeEnvironment(resources.paints.concrete, s);
  canvas.drawOval(
    { x: point.screenX - 14 * s, y: point.screenY - 8 * s, width: 18 * s, height: 9 * s },
    resources.paints.rubble,
  );
  canvas.drawRect(
    { x: point.screenX - 2 * s, y: point.screenY - 12 * s, width: 11 * s, height: 8 * s },
    resources.paints.concrete,
  );
  canvas.drawOval(
    { x: point.screenX + 2 * s, y: point.screenY - 6 * s, width: 10 * s, height: 6 * s },
    resources.paints.rubble,
  );
  reset(resources.paints.rubble);
  reset(resources.paints.concrete);
}

function drawContainer(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeEnvironment(resources.paints.container, s);
  fadeEnvironment(resources.paints.metal, s);
  canvas.drawRect(
    { x: point.screenX - 18 * s, y: point.screenY - 28 * s, width: 36 * s, height: 28 * s },
    resources.paints.container,
  );
  canvas.drawRect(
    { x: point.screenX - 18 * s, y: point.screenY - 16 * s, width: 36 * s, height: 2 * s },
    resources.paints.metal,
  );
  reset(resources.paints.container);
  reset(resources.paints.metal);
}

function drawPole(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeEnvironment(resources.paints.pole, s);
  fadeEnvironment(resources.paints.metal, s);
  canvas.drawRect(
    { x: point.screenX - 1.5 * s, y: point.screenY - 48 * s, width: 3 * s, height: 48 * s },
    resources.paints.pole,
  );
  canvas.drawRect(
    { x: point.screenX - 1.5 * s, y: point.screenY - 52 * s, width: 14 * s, height: 4 * s },
    resources.paints.metal,
  );
  canvas.drawOval(
    { x: point.screenX + 10 * s, y: point.screenY - 56 * s, width: 8 * s, height: 7 * s },
    resources.paints.metal,
  );
  reset(resources.paints.pole);
  reset(resources.paints.metal);
}

function drawFence(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeEnvironment(resources.paints.fence, s);
  fadeEnvironment(resources.paints.pole, s);
  canvas.drawRect(
    { x: point.screenX - 16 * s, y: point.screenY - 22 * s, width: 2.2 * s, height: 22 * s },
    resources.paints.pole,
  );
  canvas.drawRect(
    { x: point.screenX + 10 * s, y: point.screenY - 18 * s, width: 2.2 * s, height: 18 * s },
    resources.paints.pole,
  );
  canvas.drawRect(
    { x: point.screenX - 16 * s, y: point.screenY - 16 * s, width: 28 * s, height: 2 * s },
    resources.paints.fence,
  );
  canvas.drawRect(
    { x: point.screenX - 14 * s, y: point.screenY - 9 * s, width: 24 * s, height: 2 * s },
    resources.paints.fence,
  );
  reset(resources.paints.fence);
  reset(resources.paints.pole);
}

function drawBlock(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeEnvironment(resources.paints.concrete, s);
  fadeEnvironment(resources.paints.barrierDark, s);
  canvas.drawRect(
    { x: point.screenX - 12 * s, y: point.screenY - 16 * s, width: 24 * s, height: 16 * s },
    resources.paints.concrete,
  );
  canvas.drawRect(
    { x: point.screenX - 12 * s, y: point.screenY - 16 * s, width: 24 * s, height: 3 * s },
    resources.paints.barrierDark,
  );
  reset(resources.paints.concrete);
  reset(resources.paints.barrierDark);
}

function drawSign(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeEnvironment(resources.paints.pole, s);
  fadeEnvironment(resources.paints.signBoard, s);
  canvas.drawRect(
    { x: point.screenX - 1.4 * s, y: point.screenY - 34 * s, width: 2.8 * s, height: 34 * s },
    resources.paints.pole,
  );
  canvas.drawRect(
    { x: point.screenX - 10 * s, y: point.screenY - 42 * s, width: 18 * s, height: 12 * s },
    resources.paints.signBoard,
  );
  reset(resources.paints.pole);
  reset(resources.paints.signBoard);
}

function drawRoadsideProp(
  canvas: SkCanvas,
  resources: RenderResources,
  item: RoadsideDecoration,
  point: ScreenPoint,
): void {
  const drawers: Record<RoadsideKind, () => void> = {
    barrier: () => drawBarrier(canvas, resources, point),
    sandbag: () => drawSandbags(canvas, resources, point),
    crate: () => drawCrate(canvas, resources, point, item.seed),
    barrel: () => drawBarrel(canvas, resources, point),
    rubble: () => drawRubble(canvas, resources, point),
    container: () => drawContainer(canvas, resources, point),
    pole: () => drawPole(canvas, resources, point),
    fence: () => drawFence(canvas, resources, point),
    block: () => drawBlock(canvas, resources, point),
    sign: () => drawSign(canvas, resources, point),
  };
  drawers[item.kind]();
}

function drawRuin(
  canvas: SkCanvas,
  resources: RenderResources,
  point: ScreenPoint,
  seed: number,
): void {
  const s = point.scale;
  fadeDistant(resources.paints.skyline, s);
  fadeDistant(resources.paints.concrete, s);
  const h1 = (26 + hash01(seed) * 34) * s;
  const w1 = (16 + hash01(seed + 2) * 14) * s;
  canvas.drawRect(
    { x: point.screenX - w1 * 0.5, y: point.screenY - h1, width: w1, height: h1 },
    resources.paints.skyline,
  );
  const h2 = h1 * (0.45 + hash01(seed + 5) * 0.3);
  canvas.drawRect(
    { x: point.screenX + w1 * 0.15, y: point.screenY - h2, width: w1 * 0.55, height: h2 },
    resources.paints.concrete,
  );
  reset(resources.paints.skyline);
  reset(resources.paints.concrete);
}

function drawTower(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeDistant(resources.paints.pole, s);
  fadeDistant(resources.paints.concrete, s);
  canvas.drawRect(
    { x: point.screenX - 2.2 * s, y: point.screenY - 58 * s, width: 4.4 * s, height: 58 * s },
    resources.paints.pole,
  );
  canvas.drawRect(
    { x: point.screenX - 10 * s, y: point.screenY - 70 * s, width: 20 * s, height: 14 * s },
    resources.paints.concrete,
  );
  reset(resources.paints.pole);
  reset(resources.paints.concrete);
}

function drawAntenna(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeDistant(resources.paints.metal, s);
  canvas.drawRect(
    { x: point.screenX - 1.1 * s, y: point.screenY - 72 * s, width: 2.2 * s, height: 72 * s },
    resources.paints.metal,
  );
  canvas.drawRect(
    { x: point.screenX - 8 * s, y: point.screenY - 58 * s, width: 16 * s, height: 2 * s },
    resources.paints.metal,
  );
  canvas.drawRect(
    { x: point.screenX - 6 * s, y: point.screenY - 46 * s, width: 12 * s, height: 2 * s },
    resources.paints.metal,
  );
  reset(resources.paints.metal);
}

function drawWarehouse(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  fadeDistant(resources.paints.container, s);
  fadeDistant(resources.paints.skyline, s);
  canvas.drawRect(
    { x: point.screenX - 28 * s, y: point.screenY - 24 * s, width: 56 * s, height: 24 * s },
    resources.paints.container,
  );
  canvas.drawRect(
    { x: point.screenX - 28 * s, y: point.screenY - 30 * s, width: 56 * s, height: 6 * s },
    resources.paints.skyline,
  );
  reset(resources.paints.container);
  reset(resources.paints.skyline);
}

function drawSmoke(canvas: SkCanvas, resources: RenderResources, point: ScreenPoint): void {
  const s = point.scale;
  resources.paints.smoke.setAlphaf(0.12 + Math.min(0.16, point.scale * 0.18));
  canvas.drawOval(
    { x: point.screenX - 10 * s, y: point.screenY - 28 * s, width: 20 * s, height: 18 * s },
    resources.paints.smoke,
  );
  canvas.drawOval(
    { x: point.screenX - 8 * s, y: point.screenY - 46 * s, width: 18 * s, height: 16 * s },
    resources.paints.smoke,
  );
  canvas.drawOval(
    { x: point.screenX - 6 * s, y: point.screenY - 62 * s, width: 16 * s, height: 14 * s },
    resources.paints.smoke,
  );
  reset(resources.paints.smoke);
}

function drawDistantProp(
  canvas: SkCanvas,
  resources: RenderResources,
  item: DistantDecoration,
  point: ScreenPoint,
): void {
  const drawers: Record<DistantKind, () => void> = {
    ruin: () => drawRuin(canvas, resources, point, item.seed),
    tower: () => drawTower(canvas, resources, point),
    antenna: () => drawAntenna(canvas, resources, point),
    smoke: () => drawSmoke(canvas, resources, point),
    warehouse: () => drawWarehouse(canvas, resources, point),
  };
  drawers[item.kind]();
}

export function drawEnvironment(
  canvas: SkCanvas,
  resources: RenderResources,
  decorations: WorldDecorations,
  cameraZ: number,
  width: number,
  height: number,
): void {
  const distant = sortFarToNear(decorations.distant);
  const roadside = sortFarToNear(decorations.roadside);
  let i = 0;
  let j = 0;

  while (i < distant.length || j < roadside.length) {
    const far = distant[i];
    const near = roadside[j];
    const useDistant = !near || (far !== undefined && far.z >= near.z);
    if (useDistant && far) {
      drawDistantProp(
        canvas,
        resources,
        far,
        project(far.x, far.z, cameraZ, width, height),
      );
      i += 1;
    } else if (near) {
      drawRoadsideProp(
        canvas,
        resources,
        near,
        project(near.x, near.z, cameraZ, width, height),
      );
      j += 1;
    }
  }
}
