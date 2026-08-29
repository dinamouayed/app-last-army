import type { SkCanvas } from '@shopify/react-native-skia';

import { Skia, matchFont } from './skia';

import { HAZARD_CONFIG } from '../game/config/hazards';
import { GAME_CONFIG } from '../game/config/game';
import type { Hazard } from '../game/entities/hazards';
import { worldToScreen } from '../game/math/camera';
import type { GameState } from '../game/types';
import type { RenderResources } from './paints';

const tntFont = matchFont({
  fontFamily: 'System',
  fontSize: 22,
  fontWeight: 'bold',
});

function reset(paint: { setAlphaf: (value: number) => void }): void {
  paint.setAlphaf(1);
}

function drawDynamiteStick(
  canvas: SkCanvas,
  resources: RenderResources,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  canvas.save();
  canvas.translate(x + w * 0.5, y + h);

  resources.paints.soldierShadow.setAlphaf(0.22);
  canvas.drawOval({ x: -w * 0.55, y: -3, width: w * 1.1, height: 6 }, resources.paints.soldierShadow);
  reset(resources.paints.soldierShadow);

  canvas.drawRRect(
    Skia.RRectXY({ x: -w * 0.5, y: -h, width: w, height: h }, w * 0.42, w * 0.42),
    resources.paints.gateNegative,
  );
  canvas.drawRRect(
    Skia.RRectXY({ x: -w * 0.38, y: -h + 3, width: w * 0.28, height: h - 8 }, w * 0.2, w * 0.2),
    resources.paints.gateNegativeGlow,
  );
  canvas.drawRRect(
    Skia.RRectXY({ x: -w * 0.42, y: -h - 4, width: w * 0.84, height: 8 }, 3, 3),
    resources.paints.sandbag,
  );
  canvas.drawRRect(
    Skia.RRectXY({ x: -w * 0.32, y: -h - 2, width: w * 0.4, height: 3 }, 1.5, 1.5),
    resources.paints.hazardDirt,
  );
  canvas.restore();
}

function drawTntCrate(
  canvas: SkCanvas,
  resources: RenderResources,
  hazard: Hazard,
  state: GameState,
  width: number,
  height: number,
): void {
  const point = worldToScreen(
    hazard.x,
    hazard.z,
    state.distance,
    width,
    height,
    GAME_CONFIG.camera,
  );
  const s = point.scale * GAME_CONFIG.soldierDrawScale * 1.08;
  const pulse = 0.55 + 0.45 * Math.sin(state.elapsed * 7 + hazard.id);
  const spark = 0.55 + 0.45 * Math.sin(state.elapsed * 22 + hazard.id * 1.7);

  const cx = point.screenX;
  const cy = point.screenY;

  resources.paints.gateNegative.setAlphaf(0.16 + pulse * 0.12);
  canvas.drawOval(
    { x: cx - 28 * s, y: cy - 8 * s, width: 56 * s, height: 16 * s },
    resources.paints.gateNegative,
  );
  resources.paints.gateNegativeGlow.setAlphaf(0.12 + pulse * 0.1);
  canvas.drawOval(
    { x: cx - 18 * s, y: cy - 5 * s, width: 36 * s, height: 10 * s },
    resources.paints.gateNegativeGlow,
  );
  reset(resources.paints.gateNegative);
  reset(resources.paints.gateNegativeGlow);

  canvas.save();
  canvas.translate(cx, cy);
  canvas.scale(s, s);

  const boxW = 40;
  const boxH = 30;
  const depth = 12;
  const frontX = -boxW * 0.5;
  const frontY = -boxH - 2;
  const side = 7;

  resources.paints.soldierShadow.setAlphaf(0.32);
  canvas.drawOval({ x: -22, y: -5, width: 46, height: 12 }, resources.paints.soldierShadow);
  reset(resources.paints.soldierShadow);

  const sidePath = resources.path;
  sidePath.rewind();
  sidePath.moveTo(frontX + boxW, frontY + boxH);
  sidePath.lineTo(frontX + boxW + side, frontY + boxH - depth * 0.35);
  sidePath.lineTo(frontX + boxW + side, frontY - depth * 0.35);
  sidePath.lineTo(frontX + boxW, frontY);
  sidePath.close();
  canvas.drawPath(sidePath, resources.paints.barrelWoodDark);

  canvas.drawRRect(
    Skia.RRectXY({ x: frontX, y: frontY, width: boxW, height: boxH }, 3, 3),
    resources.paints.barrelWood,
  );

  const topPath = resources.path;
  topPath.rewind();
  topPath.moveTo(frontX, frontY);
  topPath.lineTo(frontX + boxW, frontY);
  topPath.lineTo(frontX + boxW + side, frontY - depth * 0.35);
  topPath.lineTo(frontX + side, frontY - depth * 0.35);
  topPath.close();
  canvas.drawPath(topPath, resources.paints.sandbag);

  resources.paints.barrelWoodDark.setAlphaf(0.55);
  canvas.drawRect({ x: frontX + 4, y: frontY + 7, width: boxW - 8, height: 1.6 }, resources.paints.barrelWoodDark);
  canvas.drawRect({ x: frontX + 4, y: frontY + boxH - 8, width: boxW - 8, height: 1.6 }, resources.paints.barrelWoodDark);
  reset(resources.paints.barrelWoodDark);

  canvas.drawRRect(
    Skia.RRectXY({ x: frontX - 1, y: frontY + 5, width: boxW + 2, height: 5 }, 1.2, 1.2),
    resources.paints.barrelHoop,
  );
  canvas.drawRRect(
    Skia.RRectXY({ x: frontX - 1, y: frontY + boxH - 9, width: boxW + 2, height: 5 }, 1.2, 1.2),
    resources.paints.barrelHoop,
  );

  const plateW = 28;
  const plateH = 16;
  const plateX = -plateW * 0.5;
  const plateY = frontY + 9;
  canvas.drawRRect(
    Skia.RRectXY({ x: plateX, y: plateY, width: plateW, height: plateH }, 3, 3),
    resources.paints.gateNegative,
  );
  resources.paints.gateNegativeGlow.setAlphaf(0.35 + pulse * 0.25);
  canvas.drawRRect(
    Skia.RRectXY({ x: plateX + 2, y: plateY + 2, width: plateW - 4, height: 5 }, 2, 2),
    resources.paints.gateNegativeGlow,
  );
  reset(resources.paints.gateNegativeGlow);

  resources.paints.hazardOutline.setStrokeWidth(1.4);
  for (let i = 0; i < 5; i += 1) {
    const sx = plateX + 3 + i * 5.2;
    canvas.drawLine(sx, plateY + 2, sx + 6, plateY + plateH - 2, resources.paints.hazardOutline);
  }
  resources.paints.hazardOutline.setStrokeWidth(2.4);

  canvas.save();
  canvas.translate(0, plateY + 12);
  canvas.drawRRect(
    Skia.RRectXY({ x: -17, y: -11, width: 34, height: 14 }, 2, 2),
    resources.paints.barrelHoop,
  );
  resources.paints.gateLabelShadow.setAlphaf(0.85);
  canvas.drawText('TNT', -18.5, 1.4, resources.paints.gateLabelShadow, tntFont);
  canvas.drawText('TNT', -20, 0, resources.paints.gateLabel, tntFont);
  reset(resources.paints.gateLabelShadow);
  canvas.restore();

  drawDynamiteStick(canvas, resources, -16, frontY - 22, 9, 20);
  drawDynamiteStick(canvas, resources, -5, frontY - 26, 10, 22);
  drawDynamiteStick(canvas, resources, 7, frontY - 21, 9, 19);

  const fusePath = resources.path;
  fusePath.rewind();
  fusePath.moveTo(0, frontY - 26);
  fusePath.quadTo(10, frontY - 38, 16, frontY - 34);
  resources.paints.crack.setStrokeWidth(2.2);
  canvas.drawPath(fusePath, resources.paints.crack);
  resources.paints.crack.setStrokeWidth(1.6);

  const sparkX = 16;
  const sparkY = frontY - 34;
  resources.paints.muzzleFlash.setAlphaf(0.45 + spark * 0.5);
  canvas.drawCircle(sparkX, sparkY, 5.2 + spark * 1.4, resources.paints.muzzleFlash);
  resources.paints.muzzleCore.setAlphaf(0.8);
  canvas.drawCircle(sparkX, sparkY, 2.4 + spark * 0.8, resources.paints.muzzleCore);
  resources.paints.particle.setAlphaf(0.7);
  canvas.drawCircle(sparkX + 1.2, sparkY - 1.4, 1.3, resources.paints.particle);
  reset(resources.paints.muzzleFlash);
  reset(resources.paints.muzzleCore);
  reset(resources.paints.particle);

  canvas.restore();
}

export function drawHazards(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  const order = state.hazards
    .map((hazard, index) => ({ hazard, index }))
    .filter((item) => item.hazard.active && !item.hazard.activated)
    .sort((a, b) => b.hazard.z - a.hazard.z);

  for (let i = 0; i < order.length; i += 1) {
    const item = order[i];
    if (!item) {
      continue;
    }
    const farZ = item.hazard.z + HAZARD_CONFIG.length;
    if (farZ < state.distance + GAME_CONFIG.camera.zClip) {
      continue;
    }
    drawTntCrate(canvas, resources, item.hazard, state, width, height);
  }
}
