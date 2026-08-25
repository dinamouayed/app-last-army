import { Skia, matchFont, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';

import { GATE_CONFIG } from '../game/config/gates';
import { GAME_CONFIG } from '../game/config/game';
import type { Gate } from '../game/entities/gates';
import { formatGateLabel, isPositiveGate } from '../game/entities/gates';
import { shootableGateProgress } from '../game/systems/gateEvolution';
import { worldToScreen } from '../game/math/camera';
import type { GameState } from '../game/types';
import type { RenderResources } from './paints';

const gateFont = matchFont({
  fontFamily: 'System',
  fontSize: 34,
  fontWeight: 'bold',
});

interface GateVisualPaints {
  fill: SkPaint;
  glow: SkPaint;
  frame: SkPaint;
}

function gateVisualPaints(resources: RenderResources, gate: Gate): GateVisualPaints {
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

function drawOneGate(
  canvas: SkCanvas,
  resources: RenderResources,
  gate: Gate,
  state: GameState,
  width: number,
  height: number,
): void {
  const fade = gate.activated
    ? Math.max(0, 1 - gate.fadeT / GATE_CONFIG.fadeOutDuration)
    : 1;
  if (fade <= 0.01) {
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
  const laneHalfPx = laneHalfWidthPx(width, point.scale);
  const panelW = laneHalfPx * 2 * 0.94;
  const panelH = 92 * GAME_CONFIG.soldierDrawScale * point.scale;
  const label = formatGateLabel(gate);
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
