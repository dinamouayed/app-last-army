import { checkArmyGameOver } from '../army/armyState';
import { forwardSpeedForDistance, type GameConfig } from '../config/game';
import { interpolateToward, laneIndexToX } from '../math/lanes';
import type { GameState } from '../types';

export function updateRunner(
  state: GameState,
  dt: number,
  config: GameConfig,
): void {
  if (state.status !== 'running') {
    return;
  }

  state.elapsed += dt;
  state.distance += forwardSpeedForDistance(state.distance, config) * dt;

  const targetX = laneIndexToX(state.targetLane, config.laneSpacing);
  state.armyX = interpolateToward(
    state.armyX,
    targetX,
    dt,
    config.laneLerpSpeed,
  );

  checkArmyGameOver(state);
}
