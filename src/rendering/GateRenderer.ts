import { Skia, matchFont, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';

import { GATE_CONFIG } from '../game/config/gates';
import { GAME_CONFIG } from '../game/config/game';
import type { WeaponId } from '../game/config/weapons';
import type { Gate } from '../game/entities/gates';
import { formatGateLabel, isPositiveGate, isWeaponGate } from '../game/entities/gates';
import { shootableGateProgress } from '../game/systems/gateEvolution';
import { worldToScreen, playerWorldZ } from '../game/math/camera';
import type { GameState } from '../game/types';
import type { RenderResources } from './paints';

const gateFont = matchFont({
  fontFamily: 'System',
  fontSize: 34,
  fontWeight: 'bold',
});

const barrelHpFont = matchFont({
  fontFamily: 'System',
  fontSize: 44,
  fontWeight: 'bold',
});

interface GateVisualPaints {
  fill: SkPaint;
  glow: SkPaint;
  frame: SkPaint;
}

function gateVisualPaints(resources: RenderResources, gate: Gate): GateVisualPaints {
  if (isWeaponGate(gate)) {
    return {
      fill: resources.paints.weaponCrate,
      glow: resources.paints.accent,
      frame: resources.paints.weaponCrateDark,
    };
  }
  if (!gate.shootable && gate.operation === 'multiply') {
    return {
      fill: resources.paints.gateMultiply,
      glow: resources.paints.gateMultiplyGlow,
      frame: resources.paints.gateMultiplyFrame,
    };
  }
  if (isPositiveGate(gate)) {
    return {
      fill: resources.paints.gatePositive,
      glow: resources.paints.gatePositiveGlow,
      frame: resources.paints.gatePositiveFrame,
    };
  }
  return {
    fill: resources.paints.gateNegative,
    glow: resources.paints.gateNegativeGlow,
    frame: resources.paints.gateNegativeFrame,
  };
}

function laneHalfWidthPx(screenWidth: number, scale: number): number {
  const { camera } = GAME_CONFIG;
  const roadHalfPx = screenWidth * camera.nearRoadHalfWidthRatio * scale;
  return roadHalfPx / 3;
}

function drawGateLabel(
  canvas: SkCanvas,
  resources: RenderResources,
  label: string,
  centerX: number,
  centerY: number,
  scale: number,
  alpha: number,
  pop = 1,
): void {
  if (alpha <= 0.02) {
    return;
  }

  canvas.save();
  canvas.translate(centerX, centerY);
  canvas.scale(scale * pop, scale * pop);

  const shadowOffset = 2.2;
  resources.paints.gateLabelShadow.setAlphaf(0.82 * alpha);
  canvas.drawText(label, -label.length * 9.2 + shadowOffset, shadowOffset, resources.paints.gateLabelShadow, gateFont);
  resources.paints.gateLabel.setAlphaf(alpha);
  canvas.drawText(label, -label.length * 9.2, 0, resources.paints.gateLabel, gateFont);
  resources.paints.gateLabel.setAlphaf(1);
  resources.paints.gateLabelShadow.setAlphaf(1);
  canvas.restore();
}

function drawShootableProgress(
  canvas: SkCanvas,
  resources: RenderResources,
  gate: Gate,
  x: number,
  y: number,
  panelW: number,
  panelH: number,
  scale: number,
  alpha: number,
  paints: GateVisualPaints,
): void {
  const progress = shootableGateProgress(gate);
  const barH = Math.max(3, 4.5 * scale);
  const barY = y + panelH - barH - Math.max(5, 8 * scale);
  const barX = x + panelW * 0.14;
  const barW = panelW * 0.72;

  resources.paints.hpBack.setAlphaf(0.55 * alpha);
  canvas.drawRRect(Skia.RRectXY({ x: barX, y: barY, width: barW, height: barH }, 2, 2), resources.paints.hpBack);

  paints.glow.setAlphaf(0.85 * alpha);
  canvas.drawRRect(
    Skia.RRectXY({ x: barX + 0.8 * scale, y: barY + 0.6 * scale, width: (barW - 1.6 * scale) * progress, height: barH - 1.2 * scale }, 2, 2),
    paints.glow,
  );
  resources.paints.hpBack.setAlphaf(1);
  paints.glow.setAlphaf(1);
}

function drawVerticalPortal(
  canvas: SkCanvas,
  resources: RenderResources,
  paints: GateVisualPaints,
  gate: Gate,
  centerX: number,
  baseY: number,
  panelW: number,
  panelH: number,
  scale: number,
  alpha: number,
  label: string,
): void {
  const x = centerX - panelW * 0.5;
  const y = baseY - panelH;
  const radius = Math.max(6, 10 * scale);
  const inset = Math.max(3, 5 * scale);
  const frameWidth = Math.max(2.8, 4.2 * scale);

  paints.frame.setStrokeWidth(frameWidth);

  const outerGlow = Skia.RRectXY({ x: x - 4 * scale, y: y - 3 * scale, width: panelW + 8 * scale, height: panelH + 6 * scale }, radius + 2, radius + 2);
  paints.glow.setAlphaf(0.22 * alpha);
  canvas.drawRRect(outerGlow, paints.glow);

  const outerFrame = Skia.RRectXY({ x, y, width: panelW, height: panelH }, radius, radius);
  paints.frame.setAlphaf(0.95 * alpha);
  canvas.drawRRect(outerFrame, paints.frame);

  const innerFill = Skia.RRectXY(
    { x: x + inset, y: y + inset, width: panelW - inset * 2, height: panelH - inset * 2 },
    Math.max(4, radius - 2),
    Math.max(4, radius - 2),
  );
  paints.fill.setAlphaf(0.34 * alpha);
  canvas.drawRRect(innerFill, paints.fill);

  paints.glow.setAlphaf(0.14 * alpha);
  canvas.drawRRect(
    Skia.RRectXY(
      { x: x + panelW * 0.18, y: y + inset * 1.4, width: panelW * 0.12, height: panelH - inset * 3 },
      3,
      3,
    ),
    paints.glow,
  );

  paints.fill.setAlphaf(1);
  paints.glow.setAlphaf(1);
  paints.frame.setAlphaf(1);

  if (gate.shootable) {
    drawShootableProgress(canvas, resources, gate, x, y, panelW, panelH, scale, alpha, paints);
  }

  const pop = gate.valueFlash > 0
    ? 1 + (gate.valueFlash / GATE_CONFIG.shootable.valueFlashDuration) * 0.18
    : 1;
  drawGateLabel(canvas, resources, label, centerX, y + panelH * 0.52, scale, alpha, pop);
}

function drawBarrelHpNumber(
  canvas: SkCanvas,
  resources: RenderResources,
  label: string,
  centerX: number,
  centerY: number,
  scale: number,
  alpha: number,
  pop: number,
): void {
  canvas.save();
  canvas.translate(centerX, centerY);
  canvas.scale(scale * pop, scale * pop);
  resources.paints.gateLabelShadow.setAlphaf(0.95 * alpha);
  canvas.drawText(label, -label.length * 11 + 2.5, 3, resources.paints.gateLabelShadow, barrelHpFont);
  resources.paints.gateLabel.setAlphaf(alpha);
  canvas.drawText(label, -label.length * 11, 0, resources.paints.gateLabel, barrelHpFont);
  resources.paints.gateLabel.setAlphaf(1);
  resources.paints.gateLabelShadow.setAlphaf(1);
  canvas.restore();
}

function drawWeaponTurretIcon(
  canvas: SkCanvas,
  resources: RenderResources,
  weaponId: WeaponId | null,
  centerX: number,
  anchorY: number,
  panelW: number,
  panelH: number,
  scale: number,
  alpha: number,
  iconScale: number,
): void {
  if (!weaponId) {
    return;
  }

  canvas.save();
  canvas.translate(centerX, anchorY);
  canvas.scale(iconScale, iconScale);
  canvas.translate(-centerX, -anchorY);

  const glowW = panelW * 0.56;
  const glowH = panelH * 0.13;
  const glowY = anchorY + panelH * 0.08;

  resources.paints.weaponGlowOuter.setAlphaf(0.55 * alpha);
  canvas.drawOval(
    Skia.XYWHRect(centerX - glowW * 0.55, glowY - glowH * 0.4, glowW * 1.1, glowH),
    resources.paints.weaponGlowOuter,
  );
  resources.paints.weaponGlow.setAlphaf(0.72 * alpha);
  canvas.drawOval(
    Skia.XYWHRect(centerX - glowW * 0.4, glowY - glowH * 0.28, glowW * 0.8, glowH * 0.72),
    resources.paints.weaponGlow,
  );

  const platformW = panelW * 0.38;
  const platformH = panelH * 0.11;
  const platformX = centerX - platformW * 0.5;
  const platformY = anchorY + panelH * 0.12;
  resources.paints.soldierGunMetal.setAlphaf(0.94 * alpha);
  canvas.drawRRect(
    Skia.RRectXY({ x: platformX, y: platformY, width: platformW, height: platformH }, 3 * scale, 3 * scale),
    resources.paints.soldierGunMetal,
  );

  const wheelR = panelH * 0.048;
  resources.paints.barrelHoop.setAlphaf(0.92 * alpha);
  canvas.drawCircle(platformX + wheelR + 2 * scale, platformY + platformH, wheelR, resources.paints.barrelHoop);
  canvas.drawCircle(platformX + platformW - wheelR - 2 * scale, platformY + platformH, wheelR, resources.paints.barrelHoop);

  const bodyY = anchorY - panelH * 0.02;
  resources.paints.gateMultiplyGlow.setAlphaf(0.45 * alpha);
  canvas.drawRRect(
    Skia.RRectXY(
      {
        x: centerX - panelW * 0.22,
        y: bodyY - panelH * 0.02,
        width: panelW * 0.44,
        height: panelH * 0.28,
      },
      6 * scale,
      6 * scale,
    ),
    resources.paints.gateMultiplyGlow,
  );

  if (weaponId === 'smg') {
    const bodyW = panelW * 0.28;
    const bodyH = panelH * 0.16;
    const bodyX = centerX - bodyW * 0.5;
    resources.paints.gateMultiply.setAlphaf(0.96 * alpha);
    canvas.drawRRect(Skia.RRectXY({ x: bodyX, y: bodyY, width: bodyW, height: bodyH }, 4 * scale, 4 * scale), resources.paints.gateMultiply);
    resources.paints.soldierUniformDark.setAlphaf(0.95 * alpha);
    canvas.drawRRect(
      Skia.RRectXY({ x: centerX - panelW * 0.04, y: bodyY + bodyH * 0.28, width: panelW * 0.22, height: bodyH * 0.35 }, 3 * scale, 3 * scale),
      resources.paints.soldierUniformDark,
    );
  } else if (weaponId === 'shotgun') {
    const bodyW = panelW * 0.34;
    const bodyH = panelH * 0.18;
    const bodyX = centerX - bodyW * 0.5;
    resources.paints.gateMultiply.setAlphaf(0.96 * alpha);
    canvas.drawRRect(Skia.RRectXY({ x: bodyX, y: bodyY, width: bodyW, height: bodyH }, 5 * scale, 5 * scale), resources.paints.gateMultiply);
    const barrelR = bodyH * 0.32;
    for (const offset of [-bodyW * 0.18, bodyW * 0.18]) {
      resources.paints.soldierUniformDark.setAlphaf(0.95 * alpha);
      canvas.drawCircle(centerX + offset, bodyY + bodyH * 0.45, barrelR, resources.paints.soldierUniformDark);
      resources.paints.gateMultiplyGlow.setAlphaf(0.9 * alpha);
      canvas.drawCircle(centerX + offset, bodyY + bodyH * 0.45, barrelR * 0.52, resources.paints.gateMultiplyGlow);
    }
  } else {
    const bodyW = panelW * 0.36;
    const bodyH = panelH * 0.2;
    const bodyX = centerX - bodyW * 0.5;
    resources.paints.gateMultiply.setAlphaf(0.96 * alpha);
    canvas.drawRRect(Skia.RRectXY({ x: bodyX, y: bodyY, width: bodyW, height: bodyH }, 5 * scale, 5 * scale), resources.paints.gateMultiply);
    resources.paints.weaponCrateDark.setAlphaf(0.9 * alpha);
    canvas.drawRRect(
      Skia.RRectXY({ x: bodyX - bodyW * 0.12, y: bodyY + bodyH * 0.15, width: bodyW * 0.28, height: bodyH * 0.55 }, 3 * scale, 3 * scale),
      resources.paints.weaponCrateDark,
    );
    const barrelR = bodyH * 0.26;
    for (const offset of [-bodyW * 0.14, bodyW * 0.14]) {
      resources.paints.soldierUniformDark.setAlphaf(0.95 * alpha);
      canvas.drawCircle(centerX + offset, bodyY + bodyH * 0.42, barrelR, resources.paints.soldierUniformDark);
      resources.paints.gateMultiplyGlow.setAlphaf(0.88 * alpha);
      canvas.drawCircle(centerX + offset, bodyY + bodyH * 0.42, barrelR * 0.5, resources.paints.gateMultiplyGlow);
    }
  }

  resources.paints.weaponGlowOuter.setAlphaf(1);
  resources.paints.weaponGlow.setAlphaf(1);
  resources.paints.soldierGunMetal.setAlphaf(1);
  resources.paints.barrelHoop.setAlphaf(1);
  resources.paints.gateMultiply.setAlphaf(1);
  resources.paints.gateMultiplyGlow.setAlphaf(1);
  resources.paints.soldierUniformDark.setAlphaf(1);
  resources.paints.weaponCrateDark.setAlphaf(1);
  canvas.restore();
}

function drawBarrelExplosionBurst(
  canvas: SkCanvas,
  resources: RenderResources,
  centerX: number,
  centerY: number,
  bodyW: number,
  bodyH: number,
  scale: number,
  explodeProgress: number,
  alpha: number,
): void {
  const flashR = bodyW * (0.25 + explodeProgress * 0.55);
  resources.paints.contact.setAlphaf(0.7 * alpha * (1 - explodeProgress * 0.35));
  canvas.drawCircle(centerX, centerY, flashR, resources.paints.contact);
  resources.paints.muzzleFlash.setAlphaf(0.55 * alpha * (1 - explodeProgress * 0.5));
  canvas.drawCircle(centerX, centerY, flashR * 0.55, resources.paints.muzzleFlash);
  resources.paints.particle.setAlphaf(0.65 * alpha * (1 - explodeProgress * 0.4));
  canvas.drawCircle(centerX, centerY, flashR * 0.28, resources.paints.particle);

  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 + explodeProgress * 0.8;
    const dist = bodyW * (0.15 + explodeProgress * 0.55);
    const shardW = bodyW * 0.08;
    const shardH = bodyH * 0.14;
    const sx = centerX + Math.cos(angle) * dist;
    const sy = centerY + Math.sin(angle) * dist * 0.45;
    resources.paints.barrelWood.setAlphaf(0.85 * alpha * (1 - explodeProgress * 0.3));
    canvas.drawRRect(
      Skia.RRectXY({ x: sx - shardW * 0.5, y: sy - shardH * 0.5, width: shardW, height: shardH }, 2, 2),
      resources.paints.barrelWood,
    );
    resources.paints.barrelHoop.setAlphaf(0.8 * alpha * (1 - explodeProgress * 0.3));
    canvas.drawRRect(
      Skia.RRectXY({ x: sx - shardW * 0.3, y: sy - 1 * scale, width: shardW * 0.6, height: 2 * scale }, 1, 1),
      resources.paints.barrelHoop,
    );
  }

  resources.paints.contact.setAlphaf(1);
  resources.paints.muzzleFlash.setAlphaf(1);
  resources.paints.particle.setAlphaf(1);
  resources.paints.barrelWood.setAlphaf(1);
  resources.paints.barrelHoop.setAlphaf(1);
}

function drawBarrelBody(
  canvas: SkCanvas,
  resources: RenderResources,
  x: number,
  y: number,
  bodyW: number,
  bodyH: number,
  scale: number,
  alpha: number,
  shakeX: number,
): void {
  const drawX = x + shakeX;
  resources.paints.barrelWood.setAlphaf(0.96 * alpha);
  canvas.drawRRect(
    Skia.RRectXY({ x: drawX, y, width: bodyW, height: bodyH }, bodyH * 0.48, bodyH * 0.48),
    resources.paints.barrelWood,
  );

  resources.paints.barrelWoodDark.setAlphaf(0.55 * alpha);
  for (let plank = 0; plank < 4; plank += 1) {
    const plankY = y + bodyH * (0.18 + plank * 0.18);
    canvas.drawRRect(
      Skia.RRectXY({ x: drawX + 5 * scale, y: plankY, width: bodyW - 10 * scale, height: 2.5 * scale }, 1, 1),
      resources.paints.barrelWoodDark,
    );
  }

  const hoopXs = [0.12, 0.5, 0.88];
  for (let h = 0; h < hoopXs.length; h += 1) {
    const hoopX = drawX + bodyW * hoopXs[h]! - 3 * scale;
    resources.paints.barrelHoop.setAlphaf(0.92 * alpha);
    canvas.drawRRect(
      Skia.RRectXY({ x: hoopX, y: y - 2 * scale, width: 5 * scale, height: bodyH + 4 * scale }, 2, 2),
      resources.paints.barrelHoop,
    );
  }

  resources.paints.barrelWoodDark.setAlphaf(0.75 * alpha);
  canvas.drawOval(
    Skia.XYWHRect(drawX - 3 * scale, y + 2 * scale, 8 * scale, bodyH - 4 * scale),
    resources.paints.barrelWoodDark,
  );
  canvas.drawOval(
    Skia.XYWHRect(drawX + bodyW - 5 * scale, y + 2 * scale, 8 * scale, bodyH - 4 * scale),
    resources.paints.barrelWoodDark,
  );

  resources.paints.barrelWood.setAlphaf(1);
  resources.paints.barrelWoodDark.setAlphaf(1);
  resources.paints.barrelHoop.setAlphaf(1);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function drawWoodenBarrel(
  canvas: SkCanvas,
  resources: RenderResources,
  gate: Gate,
  state: GameState,
  centerX: number,
  baseY: number,
  panelW: number,
  panelH: number,
  scale: number,
  alpha: number,
  label: string,
  width: number,
  height: number,
): void {
  const bodyW = panelW * 0.82;
  const bodyH = panelH * 0.88;
  const x = centerX - bodyW * 0.5;
  const y = baseY - panelH + 4 * scale;
  const iconAnchorY = baseY - panelH - panelH * 0.16;
  const absorbing = gate.weaponAbsorbT > 0;
  const exploding = gate.explodeT > 0;
  const explodeProgress = exploding
    ? 1 - gate.explodeT / GATE_CONFIG.weaponGate.explodeDuration
    : 0;
  const absorbProgress = absorbing
    ? 1 - gate.weaponAbsorbT / GATE_CONFIG.weaponGate.absorbDuration
    : 0;
  const absorbEase = easeInCubic(absorbProgress);

  if (absorbing) {
    const armyZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const armyPoint = worldToScreen(
      state.armyX,
      armyZ,
      state.distance,
      width,
      height,
      GAME_CONFIG.camera,
    );
    const startX = centerX;
    const startY = iconAnchorY - panelH * 0.12;
    const endX = armyPoint.screenX;
    const endY = armyPoint.screenY - panelH * 0.55;
    const iconX = startX + (endX - startX) * absorbEase;
    const iconY = startY + (endY - startY) * absorbEase;
    const iconScale = (1.55 - absorbEase * 1.25) * 1.12;
    const iconAlpha = alpha * (1 - absorbEase * 0.35);

    resources.paints.weaponGlow.setAlphaf(0.35 * iconAlpha * (1 - absorbEase));
    canvas.drawCircle(iconX, iconY, panelW * 0.18 * (1 - absorbEase * 0.7), resources.paints.weaponGlow);
    resources.paints.weaponGlow.setAlphaf(1);

    drawWeaponTurretIcon(
      canvas,
      resources,
      gate.weaponId,
      iconX,
      iconY,
      panelW,
      panelH,
      scale,
      iconAlpha,
      iconScale,
    );
    return;
  }

  const drawAlpha = exploding ? alpha * Math.max(0.15, 1 - explodeProgress * 0.85) : alpha;

  if (drawAlpha <= 0.02 && !exploding) {
    return;
  }

  const iconScale = exploding ? 1.12 + explodeProgress * 0.5 : 1.12;
  const showBody = !exploding || explodeProgress < 0.38;
  const shakeX = exploding && explodeProgress < 0.38 ? Math.sin(explodeProgress * 42) * 3 * scale : 0;

  if (showBody) {
    drawBarrelBody(canvas, resources, x, y, bodyW, bodyH, scale, drawAlpha, shakeX);
    if (gate.valueFlash > 0) {
      resources.paints.hitFlash.setAlphaf(0.35 * drawAlpha);
      canvas.drawRRect(
        Skia.RRectXY({ x: x + shakeX, y, width: bodyW, height: bodyH }, bodyH * 0.48, bodyH * 0.48),
        resources.paints.hitFlash,
      );
      resources.paints.hitFlash.setAlphaf(1);
    }
    if (!exploding) {
      const pop = gate.valueFlash > 0
        ? 1 + (gate.valueFlash / GATE_CONFIG.weaponGate.hitFlashDuration) * 0.12
        : 1;
      drawBarrelHpNumber(canvas, resources, label, centerX + shakeX, y + bodyH * 0.58, scale, drawAlpha, pop);
    }
  }

  if (exploding) {
    drawBarrelExplosionBurst(
      canvas,
      resources,
      centerX,
      y + bodyH * 0.5,
      bodyW,
      bodyH,
      scale,
      explodeProgress,
      alpha,
    );
  }

  drawWeaponTurretIcon(
    canvas,
    resources,
    gate.weaponId,
    centerX,
    iconAnchorY - (exploding ? explodeProgress * panelH * 0.15 : 0),
    panelW,
    panelH,
    scale,
    exploding ? alpha : drawAlpha,
    iconScale,
  );
}

function drawOneGate(
  canvas: SkCanvas,
  resources: RenderResources,
  gate: Gate,
  state: GameState,
  width: number,
  height: number,
): void {
  const fade = gate.weaponAbsorbT > 0 || gate.explodeT > 0
    ? 1
    : gate.activated
      ? Math.max(0, 1 - gate.fadeT / GATE_CONFIG.fadeOutDuration)
      : gate.weaponReady
        ? Math.max(0, 1 - gate.fadeT / GATE_CONFIG.weaponGate.explodeDuration)
        : 1;
  if (fade <= 0.01 && gate.explodeT <= 0 && gate.weaponAbsorbT <= 0) {
    return;
  }

  const point = worldToScreen(
    gate.x,
    gate.z,
    state.distance,
    width,
    height,
    GAME_CONFIG.camera,
  );
  const label = formatGateLabel(gate);
  const laneHalfPx = laneHalfWidthPx(width, point.scale);
  const panelW = laneHalfPx * 2 * 0.94;
  const panelH = 92 * GAME_CONFIG.soldierDrawScale * point.scale;

  if (isWeaponGate(gate)) {
    drawWoodenBarrel(
      canvas,
      resources,
      gate,
      state,
      point.screenX,
      point.screenY,
      panelW,
      panelH,
      point.scale,
      fade,
      label,
      width,
      height,
    );
    return;
  }

  const paints = gateVisualPaints(resources, gate);
  const evolveBoost = gate.evolvePulse > 0 ? 1.08 : 1;

  drawVerticalPortal(
    canvas,
    resources,
    paints,
    gate,
    point.screenX,
    point.screenY,
    panelW * evolveBoost,
    panelH * evolveBoost,
    point.scale,
    fade,
    label,
  );
}

export function drawGates(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  const order = state.gates
    .map((gate, index) => ({ gate, index }))
    .filter((item) => item.gate.active)
    .sort((a, b) => b.gate.z - a.gate.z);

  for (let i = 0; i < order.length; i += 1) {
    const item = order[i];
    if (!item) {
      continue;
    }
    drawOneGate(canvas, resources, item.gate, state, width, height);
  }
}

export function drawGateActivationPulse(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  if (state.gatePulse <= 0) {
    return;
  }

  const pulse = state.gatePulse / GATE_CONFIG.activationFeedbackDuration;
  const point = worldToScreen(
    state.gatePulseX,
    state.gatePulseZ,
    state.distance,
    width,
    height,
    GAME_CONFIG.camera,
  );
  const laneHalfPx = laneHalfWidthPx(width, point.scale);
  const panelW = laneHalfPx * 2 * 0.94;
  const panelH = 92 * GAME_CONFIG.soldierDrawScale * point.scale;
  const paint = state.gatePulsePositive
    ? resources.paints.gatePositiveGlow
    : resources.paints.gateNegativeGlow;
  const expand = (1 - pulse) * 18 * point.scale;

  paint.setAlphaf(0.55 * pulse);
  canvas.drawRRect(
    Skia.RRectXY(
      {
        x: point.screenX - panelW * 0.5 - expand,
        y: point.screenY - panelH - expand * 0.35,
        width: panelW + expand * 2,
        height: panelH + expand * 0.7,
      },
      12,
      12,
    ),
    paint,
  );
  paint.setAlphaf(1);
}
