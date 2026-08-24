import type { GameConfig } from '../config/game';
import { isGameOver } from '../math/format';
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
  state.distance += config.forwardSpeed * dt;

  const targetX = laneIndexToX(state.targetLane, config.laneSpacing);
  state.armyX = interpolateToward(
    state.armyX,
    targetX,
    dt,
    config.laneLerpSpeed,
  );

  if (isGameOver(state.armySize)) {
    state.status = 'gameover';
    state.armySize = 0;
  }
}
