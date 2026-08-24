import type { SkCanvas } from '@shopify/react-native-skia';

import { GAME_CONFIG } from '../game/config/game';
import { laneIndexToX } from '../game/math/lanes';
import type { GameState } from '../game/types';
import type { RenderResources } from './paints';
import { drawSoldierAt, playerPose } from './SoldierRenderer';

export function drawArmy(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  const targetX = laneIndexToX(state.targetLane, GAME_CONFIG.laneSpacing);
  const lean = (targetX - state.armyX) * 0.85;
  drawSoldierAt(
    canvas,
    resources,
    playerPose(state.armyX, state.distance, state.elapsed, lean),
    state.distance,
    width,
    height,
  );
}
