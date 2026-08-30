import type { SkCanvas } from '@shopify/react-native-skia';

import { ARMY_CONFIG } from '../game/config/army';
import { GAME_CONFIG } from '../game/config/game';
import { worldToScreen } from '../game/math/camera';
import type { GameState } from '../game/types';
import type { RenderResources } from './paints';
import { muzzleScreenLift } from './SoldierRenderer';

export function drawProjectiles(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  for (let i = 0; i < state.projectiles.length; i += 1) {
    const projectile = state.projectiles[i];
    if (!projectile?.active) {
      continue;
    }
    const from = worldToScreen(
      projectile.prevX,
      projectile.prevZ,
      state.distance,
      width,
      height,
      GAME_CONFIG.camera,
    );
    const to = worldToScreen(
      projectile.x,
      projectile.z,
      state.distance,
      width,
      height,
      GAME_CONFIG.camera,
    );
    const fromY = from.screenY - muzzleScreenLift(from.scale, ARMY_CONFIG.visualScale);
    const toY = to.screenY - muzzleScreenLift(to.scale, ARMY_CONFIG.visualScale);
    const trailW = Math.max(2.4, 4.2 * to.scale * projectile.widthScale);
    const coreW = Math.max(1.2, 2.1 * to.scale * projectile.widthScale);

    resources.paints.tracer.setStrokeWidth(trailW);
    resources.paints.tracer.setAlphaf(0.82);
    canvas.drawLine(from.screenX, fromY, to.screenX, toY, resources.paints.tracer);
    resources.paints.tracerCore.setStrokeWidth(coreW);
    resources.paints.tracerCore.setAlphaf(1);
    canvas.drawLine(from.screenX, fromY, to.screenX, toY, resources.paints.tracerCore);

    canvas.drawCircle(
      to.screenX,
      toY,
      Math.max(1.8, 3.2 * to.scale * projectile.widthScale),
      resources.paints.muzzleCore,
    );
  }
  resources.paints.tracer.setAlphaf(1);
  resources.paints.tracerCore.setAlphaf(1);
}
