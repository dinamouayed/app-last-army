import type { SkCanvas } from '@shopify/react-native-skia';

import { COMBAT_CONFIG } from '../game/config/combat';
import { GAME_CONFIG } from '../game/config/game';
import { worldToScreen } from '../game/math/camera';
import type { GameState } from '../game/types';
import type { RenderResources } from './paints';
import { muzzleScreenLift } from './SoldierRenderer';

export function drawCombatEffects(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
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
    const size = (3.5 + (1 - life) * 3) * point.scale;
    const paint =
      particle.kind === 'gatePositive'
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
  resources.paints.gateParticlePositive.setAlphaf(1);
  resources.paints.gateParticleNegative.setAlphaf(1);
}
