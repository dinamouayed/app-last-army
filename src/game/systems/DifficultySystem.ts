import {
  getDifficultySnapshot,
  type DifficultySnapshot,
} from '../config/difficulty';
import type { GameState } from '../types';

export function snapshotDifficulty(state: GameState): DifficultySnapshot {
  return getDifficultySnapshot(state.distance, state.bossEncounterCount);
}

export {
  difficultyFactor,
  difficultyProgress,
  encounterComplexity,
  getDifficultySnapshot,
  scaledBossDamage,
  scaledBossHp,
  scaledEnemyApproachSpeed,
  scaledEnemyEngagingSpeed,
  scaledEnemyHp,
  scaledSpawnInterval,
  scaleGateValue,
  scaleShootableInitialValue,
  weaponUnlockCostMultiplier,
} from '../config/difficulty';
