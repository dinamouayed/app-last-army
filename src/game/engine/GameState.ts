import { GAME_CONFIG } from '../config/game';
import { laneIndexToX } from '../math/lanes';
import type { GameState } from '../types';

export function createGameState(): GameState {
  const armyX = laneIndexToX(GAME_CONFIG.startingLane, GAME_CONFIG.laneSpacing);

  return {
    status: 'running',
    elapsed: 0,
    distance: 0,
    armySize: GAME_CONFIG.startingArmySize,
    targetLane: GAME_CONFIG.startingLane,
    armyX,
    hasChangedLane: false,
  };
}
