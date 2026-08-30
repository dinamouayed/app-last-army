import type { SkPicture } from '@shopify/react-native-skia';

import { Skia } from './skia';

import { GAME_CONFIG } from '../game/config/game';
import { PALETTE } from '../game/config/palette';
import { horizonY } from '../game/math/camera';
import type { GameState } from '../game/types';
import { drawArmy } from './ArmyRenderer';
import { drawBoss } from './BossRenderer';
import { drawCombatEffects } from './EffectsRenderer';
import { drawEnemies } from './EnemyRenderer';
import { drawHazards } from './HazardRenderer';
import { drawGateActivationPulse, drawGates } from './GateRenderer';
import { drawHomeScene } from './HomeSceneRenderer';
import {
  applyGroundGradient,
  applySkyGradient,
  type RenderResources,
} from './paints';
import { drawProjectiles } from './ProjectileRenderer';
import { drawWorld } from './WorldRenderer';
import { cameraShakeOffset } from '../game/systems/FeelSystem';

function syncLayout(
  resources: RenderResources,
  width: number,
  height: number,
): void {
  if (resources.layout.width === width && resources.layout.height === height) {
    return;
  }
  resources.layout.width = width;
  resources.layout.height = height;
  const skyBottom = horizonY(height, GAME_CONFIG.camera) + 6;
  applySkyGradient(resources.paints.sky, skyBottom);
  applyGroundGradient(resources.paints.ground, skyBottom, height);
}

function beginFrame(
  resources: RenderResources,
  width: number,
  height: number,
) {
  syncLayout(resources, width, height);
  const canvas = resources.recorder.beginRecording(
    Skia.XYWHRect(0, 0, width, height),
  );
  canvas.clear(Skia.Color(PALETTE.screen));
  return canvas;
}

export function recordFrame(
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): SkPicture {
  const canvas = beginFrame(resources, width, height);
  const shake = cameraShakeOffset(state, state.elapsed);
  canvas.save();
  canvas.translate(shake.x, shake.y);
  drawWorld(canvas, resources, state, width, height);
  drawHazards(canvas, resources, state, width, height);
  drawGates(canvas, resources, state, width, height);
  drawEnemies(canvas, resources, state, width, height);
  drawBoss(canvas, resources, state, width, height);
  drawProjectiles(canvas, resources, state, width, height);
  drawArmy(canvas, resources, state, width, height);
  drawGateActivationPulse(canvas, resources, state, width, height);
  drawCombatEffects(canvas, resources, state, width, height);
  canvas.restore();
  return resources.recorder.finishRecordingAsPicture();
}

export function recordHomeFrame(
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): SkPicture {
  const canvas = beginFrame(resources, width, height);
  drawHomeScene(canvas, resources, state, width, height);
  return resources.recorder.finishRecordingAsPicture();
}
