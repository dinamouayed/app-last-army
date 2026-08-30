import type { SkCanvas } from '@shopify/react-native-skia';

import { armyFrontWorldZ } from '../game/army/footprint';
import { BOSS_CONFIG } from '../game/config/bosses';
import { COMBAT_CONFIG } from '../game/config/combat';
import { GAME_CONFIG } from '../game/config/game';
import { HAZARD_CONFIG } from '../game/config/hazards';
import { playerWorldZ, worldToScreen } from '../game/math/camera';
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

function resetExplosionPaints(resources: RenderResources): void {
  resources.paints.muzzleFlash.setAlphaf(1);
  resources.paints.muzzleCore.setAlphaf(1);
  resources.paints.contact.setAlphaf(1);
  resources.paints.particle.setAlphaf(1);
  resources.paints.gateNegative.setAlphaf(1);
  resources.paints.smoke.setAlphaf(1);
  resources.paints.hazardFillDark.setAlphaf(1);
  resources.paints.gateNegativeFrame.setStrokeWidth(4);
  resources.paints.gateNegativeFrame.setAlphaf(1);
}

function drawTntExplosion(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  if (state.explosionBurst <= 0) {
    return;
  }

  const point = worldToScreen(
    state.explosionBurstX,
    state.explosionBurstZ,
    state.distance,
    width,
    height,
    GAME_CONFIG.camera,
  );
  const t = 1 - state.explosionBurst / HAZARD_CONFIG.explosionDuration;
  const expand = t * (2 - t);
  const fade = Math.max(0, 1 - t * 1.08);
  const lift = muzzleScreenLift(point.scale) * 0.55;
  const cx = point.screenX;
  const cy = point.screenY - lift;
  const s = point.scale;

  const scorchW = (26 + expand * 36) * s;
  resources.paints.hazardFillDark.setAlphaf(0.5 * fade);
  canvas.drawOval(
    {
      x: cx - scorchW,
      y: cy + 6 * s,
      width: scorchW * 2,
      height: scorchW * 0.46,
    },
    resources.paints.hazardFillDark,
  );

  const ringR = (16 + expand * 68) * s;
  resources.paints.gateNegativeFrame.setStrokeWidth(Math.max(2.2, (7.5 - t * 6) * s));
  resources.paints.gateNegativeFrame.setAlphaf(0.7 * fade * (1 - t));
  canvas.drawOval(
    {
      x: cx - ringR,
      y: cy - ringR * 0.7,
      width: ringR * 2,
      height: ringR * 1.4,
    },
    resources.paints.gateNegativeFrame,
  );

  const fireR = (20 + expand * 46) * s;
  resources.paints.gateNegative.setAlphaf(0.58 * fade);
  canvas.drawCircle(cx, cy, fireR, resources.paints.gateNegative);
  resources.paints.contact.setAlphaf(0.78 * fade);
  canvas.drawCircle(cx, cy, fireR * 0.7, resources.paints.contact);
  resources.paints.muzzleFlash.setAlphaf(0.9 * fade * Math.max(0.15, 1 - t * 0.55));
  canvas.drawCircle(cx, cy, fireR * 0.44, resources.paints.muzzleFlash);
  resources.paints.muzzleCore.setAlphaf(0.95 * fade * Math.max(0, 1 - t * 1.45));
  canvas.drawCircle(cx, cy, fireR * 0.2, resources.paints.muzzleCore);

  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2 + t * 1.15;
    const dist = fireR * (0.38 + expand * 0.88);
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist * 0.52 - expand * 16 * s;
    const shard = (3.4 + (1 - t) * 5.2) * s * (i % 2 === 0 ? 1.25 : 0.82);
    const paint =
      i % 3 === 0
        ? resources.paints.muzzleFlash
        : i % 3 === 1
          ? resources.paints.contact
          : resources.paints.particle;
    paint.setAlphaf(0.82 * fade * (1 - t * 0.28));
    canvas.drawCircle(sx, sy, shard, paint);
  }

  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 + 0.35;
    const dist = fireR * (0.42 + t * 0.62);
    const sx = cx + Math.cos(angle) * dist * 0.72;
    const sy = cy + Math.sin(angle) * dist * 0.32 - t * 30 * s;
    resources.paints.smoke.setAlphaf(0.38 * fade * Math.min(1, t * 2.1));
    canvas.drawCircle(sx, sy, (9 + t * 18) * s, resources.paints.smoke);
  }

  resetExplosionPaints(resources);
}

function resetTapStrikePaints(resources: RenderResources): void {
  resources.paints.contact.setAlphaf(1);
  resources.paints.muzzleFlash.setAlphaf(1);
  resources.paints.muzzleCore.setAlphaf(1);
  resources.paints.particle.setAlphaf(1);
  resources.paints.accent.setAlphaf(1);
  resources.paints.gateNegativeFrame.setStrokeWidth(4);
  resources.paints.gateNegativeFrame.setAlphaf(1);
}

function drawTapChargeCircle(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  const strike = state.tapStrike;
  const charge = Math.max(strike.chargeVisual, strike.pulse > 0 ? 0.08 : 0);
  if (charge <= 0.02 || !state.boss.active || state.boss.dying) {
    return;
  }

  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const point = worldToScreen(
    state.armyX,
    armyFrontWorldZ(playerZ, state.formationSlots),
    state.distance,
    width,
    height,
    GAME_CONFIG.camera,
  );
  const pulse = strike.pulse / BOSS_CONFIG.tapPulseDuration;
  const radius = (26 + charge * 86 + pulse * 10) * point.scale;
  const lift = muzzleScreenLift(point.scale) * 0.7;
  const cx = point.screenX;
  const cy = point.screenY - lift;
  const alpha = 0.22 + charge * 0.55 + pulse * 0.22;

  resources.paints.gateNegativeFrame.setStrokeWidth(Math.max(2.4, (5.5 + charge * 3.2) * point.scale));
  resources.paints.gateNegativeFrame.setAlphaf(0.78 * alpha);
  canvas.drawCircle(cx, cy, radius, resources.paints.gateNegativeFrame);

  resources.paints.contact.setAlphaf(0.28 * alpha);
  canvas.drawCircle(cx, cy, radius * 0.86, resources.paints.contact);
  resources.paints.muzzleFlash.setAlphaf(0.4 * alpha);
  canvas.drawCircle(cx, cy, radius * (0.42 + charge * 0.28), resources.paints.muzzleFlash);
  resources.paints.muzzleCore.setAlphaf(0.55 * alpha * charge);
  canvas.drawCircle(cx, cy, radius * 0.2, resources.paints.muzzleCore);

  resetTapStrikePaints(resources);
}

function drawTapFireball(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  const strike = state.tapStrike;
  if (!strike.fireballActive) {
    return;
  }

  const point = worldToScreen(
    strike.fireballX,
    strike.fireballZ,
    state.distance,
    width,
    height,
    GAME_CONFIG.camera,
  );
  const flight = Math.min(1, strike.fireballT / BOSS_CONFIG.tapFireballFlight);
  const lift = muzzleScreenLift(point.scale) * 0.85;
  const cx = point.screenX;
  const cy = point.screenY - lift;
  const radius = (18 + flight * 16) * point.scale;

  resources.paints.contact.setAlphaf(0.38);
  canvas.drawCircle(cx, cy, radius * 1.55, resources.paints.contact);
  resources.paints.gateNegative.setAlphaf(0.62);
  canvas.drawCircle(cx, cy, radius * 1.12, resources.paints.gateNegative);
  resources.paints.muzzleFlash.setAlphaf(0.9);
  canvas.drawCircle(cx, cy, radius * 0.72, resources.paints.muzzleFlash);
  resources.paints.muzzleCore.setAlphaf(0.96);
  canvas.drawCircle(cx, cy, radius * 0.34, resources.paints.muzzleCore);

  resources.paints.gateNegative.setAlphaf(1);
  resetTapStrikePaints(resources);
}

function drawTapFireballImpact(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  const strike = state.tapStrike;
  if (strike.impactT <= 0) {
    return;
  }

  const point = worldToScreen(
    strike.fireballX,
    strike.fireballZ,
    state.distance,
    width,
    height,
    GAME_CONFIG.camera,
  );
  const progress = 1 - strike.impactT / BOSS_CONFIG.tapFireballImpact;
  const fade = Math.max(0, 1 - progress * 1.1);
  const expand = progress * (2 - progress);
  const lift = muzzleScreenLift(point.scale) * 0.7;
  const cx = point.screenX;
  const cy = point.screenY - lift;
  const s = point.scale;
  const fireR = (22 + expand * 52) * s;

  resources.paints.gateNegativeFrame.setStrokeWidth(Math.max(2.2, (8 - progress * 5.5) * s));
  resources.paints.gateNegativeFrame.setAlphaf(0.72 * fade * (1 - progress));
  canvas.drawCircle(cx, cy, fireR * 1.15, resources.paints.gateNegativeFrame);
  resources.paints.gateNegative.setAlphaf(0.5 * fade);
  canvas.drawCircle(cx, cy, fireR, resources.paints.gateNegative);
  resources.paints.contact.setAlphaf(0.76 * fade);
  canvas.drawCircle(cx, cy, fireR * 0.68, resources.paints.contact);
  resources.paints.muzzleFlash.setAlphaf(0.88 * fade * Math.max(0.12, 1 - progress * 0.6));
  canvas.drawCircle(cx, cy, fireR * 0.4, resources.paints.muzzleFlash);
  resources.paints.muzzleCore.setAlphaf(0.94 * fade * Math.max(0, 1 - progress * 1.4));
  canvas.drawCircle(cx, cy, fireR * 0.18, resources.paints.muzzleCore);

  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 + progress * 1.1;
    const dist = fireR * (0.4 + expand * 0.8);
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist * 0.5 - expand * 12 * s;
    resources.paints.muzzleFlash.setAlphaf(0.8 * fade * (1 - progress * 0.3));
    canvas.drawCircle(sx, sy, (3.2 + (1 - progress) * 4.5) * s, resources.paints.muzzleFlash);
  }

  resources.paints.gateNegative.setAlphaf(1);
  resetTapStrikePaints(resources);
}

export function drawCombatEffects(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  drawSlamBurst(canvas, resources, state, width, height);
  drawTntExplosion(canvas, resources, state, width, height);
  drawTapChargeCircle(canvas, resources, state, width, height);
  drawTapFireball(canvas, resources, state, width, height);
  drawTapFireballImpact(canvas, resources, state, width, height);

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
    const sizeMul = particle.kind === 'slam' ? 1.35 : particle.kind === 'explosion' ? 1.7 : 1;
    const size = (3.5 + (1 - life) * 3) * point.scale * sizeMul;
    const paint =
      particle.kind === 'slam'
        ? resources.paints.contact
        : particle.kind === 'explosion'
          ? i % 2 === 0
            ? resources.paints.muzzleFlash
            : resources.paints.contact
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
  resources.paints.muzzleFlash.setAlphaf(1);
  resources.paints.gateParticlePositive.setAlphaf(1);
  resources.paints.gateParticleNegative.setAlphaf(1);
}
