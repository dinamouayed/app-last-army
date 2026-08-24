import type { SkCanvas } from '@shopify/react-native-skia';

import type { GameState } from '../game/types';
import { buildWorldDecorations } from '../game/world/EnvironmentSystem';
import { drawEnvironment, drawSky, drawTerrain } from './EnvironmentRenderer';
import type { RenderResources } from './paints';
import { drawRoad } from './RoadRenderer';

export function drawWorld(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  const cameraZ = state.distance;
  const decorations = buildWorldDecorations(cameraZ);
  drawSky(canvas, resources, width, height);
  drawTerrain(canvas, resources, decorations, cameraZ, width, height);
  drawRoad(canvas, resources, decorations, cameraZ, width, height);
  drawEnvironment(canvas, resources, decorations, cameraZ, width, height);
}
