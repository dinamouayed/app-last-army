import type { SkCanvas } from '@shopify/react-native-skia';

import { BOSS_CONFIG } from '../game/config/bosses';
import { COMBAT_CONFIG } from '../game/config/combat';
import { GAME_CONFIG } from '../game/config/game';
import { worldToScreen } from '../game/math/camera';
import type { GameState } from '../game/types';
import type { RenderResources } from './paints';
import { muzzleScreenLift } from './SoldierRenderer';

function drawSlamBurst(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  if (state.slamBurst <= 0) {
    return;
  }

  const point = worldToScreen(
    state.slamBurstX,
    state.slamBurstZ,
    state.distance,
    width,
    height,
    GAME_CONFIG.camera,
  );
  const progress = 1 - state.slamBurst / BOSS_CONFIG.slamBurstDuration;
  const alpha = Math.max(0, 1 - progress * 1.15);
  const lift = muzzleScreenLift(point.scale) * 0.35;
  const centerX = point.screenX;
  const centerY = point.screenY - lift;
  const base = (34 + progress * 42) * point.scale;

  resources.paints.contact.setAlphaf(0.72 * alpha * (1 - progress * 0.4));
  canvas.drawCircle(centerX, centerY, base, resources.paints.contact);
  resources.paints.muzzleFlash.setAlphaf(0.62 * alpha * (1 - progress * 0.55));
  canvas.drawCircle(centerX, centerY, base * 0.58, resources.paints.muzzleFlash);
  resources.paints.particle.setAlphaf(0.78 * alpha * (1 - progress * 0.35));
  canvas.drawCircle(centerX, centerY, base * 0.32, resources.paints.particle);

  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2 + progress * 0.9;
    const dist = base * (0.22 + progress * 0.72);
    const shard = base * 0.11;
    const sx = centerX + Math.cos(angle) * dist;
    const sy = centerY + Math.sin(angle) * dist * 0.42;
    resources.paints.contact.setAlphaf(0.55 * alpha * (1 - progress * 0.5));
    canvas.drawCircle(sx, sy, shard, resources.paints.contact);
  }

  resources.paints.contact.setAlphaf(1);
  resources.paints.muzzleFlash.setAlphaf(1);
  resources.paints.particle.setAlphaf(1);
}

export function drawCombatEffects(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  drawSlamBurst(canvas, resources, state, width, height);

  if (state.contactPulse > 0) {
    const point = worldToScreen(
      state.contactX,
      state.contactZ,
      state.distance,
      width,
      height,
      GAME_CONFIG.camera,
    );
    const pulse = state.contactPulse / COMBAT_CONFIG.contactPulseDuration;
    const size = (12 + (1 - pulse) * 10) * point.scale;
    resources.paints.contact.setAlphaf(0.35 * pulse);
    canvas.drawOval(
      {
        x: point.screenX - size,
        y: point.screenY - size * 0.35,
        width: size * 2,
        height: size * 0.7,
      },
      resources.paints.contact,
    );
    resources.paints.contact.setAlphaf(1);
  }

  for (let i = 0; i < state.particles.length; i += 1) {
    const particle = state.particles[i];
    if (!particle?.active) {
      continue;
    }
    const point = worldToScreen(
      particle.x,
      particle.z,
      state.distance,
      width,
      height,
      GAME_CONFIG.camera,
    );
    const life = Math.max(0, particle.life / particle.maxLife);
    const sizeMul = particle.kind === 'slam' ? 1.35 : 1;
    const size = (3.5 + (1 - life) * 3) * point.scale * sizeMul;
    const paint =
      particle.kind === 'slam'
        ? resources.paints.contact
        : particle.kind === 'gatePositive'
          ? resources.paints.gateParticlePositive
          : particle.kind === 'gateNegative'
            ? resources.paints.gateParticleNegative
            : resources.paints.particle;
    paint.setAlphaf(0.75 * life);
    canvas.drawOval(
      {
        x: point.screenX - size,
        y: point.screenY - muzzleScreenLift(point.scale) * 0.45 - size,
        width: size * 2,
        height: size * 2,
      },
      paint,
    );
  }
  resources.paints.particle.setAlphaf(1);
  resources.paints.contact.setAlphaf(1);
  resources.paints.gateParticlePositive.setAlphaf(1);
  resources.paints.gateParticleNegative.setAlphaf(1);
}
