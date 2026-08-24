import type { SkCanvas } from '@shopify/react-native-skia';

import { GAME_CONFIG } from '../game/config/game';
import { playerWorldZ } from '../game/math/camera';
import type { GameState } from '../game/types';
import type { RenderResources } from './paints';
import {
  drawCombatSilhouette,
  drawSoldierAt,
} from './SoldierRenderer';
import { drawWorld } from './WorldRenderer';

const HOME_SOLDIERS = [
  { x: 0, depthOffset: 0, phase: 0 },
  { x: -0.38, depthOffset: 0.45, phase: 1.1 },
  { x: 0.38, depthOffset: 0.45, phase: 2.0 },
  { x: -0.62, depthOffset: 1.05, phase: 0.6 },
  { x: 0.08, depthOffset: 1.15, phase: 1.7 },
  { x: 0.62, depthOffset: 1.05, phase: 2.4 },
] as const;

export function drawHomeScene(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  drawWorld(canvas, resources, state, width, height);

  const cameraZ = state.distance;
  const playerZ = playerWorldZ(cameraZ, GAME_CONFIG.camera);

  drawCombatSilhouette(
    canvas,
    resources,
    -0.9,
    playerZ + 18,
    cameraZ,
    width,
    height,
  );
  drawCombatSilhouette(
    canvas,
    resources,
    0.15,
    playerZ + 21,
    cameraZ,
    width,
    height,
  );
  drawCombatSilhouette(
    canvas,
    resources,
    0.95,
    playerZ + 19,
    cameraZ,
    width,
    height,
  );

  for (const soldier of HOME_SOLDIERS) {
    drawSoldierAt(
      canvas,
      resources,
      {
        worldX: soldier.x,
        worldZ: playerZ + soldier.depthOffset,
        elapsed: state.elapsed,
        stridePhase: soldier.phase,
      },
      cameraZ,
      width,
      height,
    );
  }
}
