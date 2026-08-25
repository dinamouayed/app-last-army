import { buildFootprintFromSlots, enemyOverlapsArmyFootprint, type FootprintSlice } from './footprint';
import { GAME_CONFIG } from '../config/game';
import type { Enemy } from '../entities/combat';
import { playerWorldZ } from '../math/camera';
import type { GameState } from '../types';

export function buildArmyFootprintForState(state: GameState): FootprintSlice[] {
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  return buildFootprintFromSlots(state.armyX, playerZ, state.formationSlots);
}

export function isEnemyInArmyContact(enemy: Enemy, footprint: FootprintSlice[]): boolean {
  if (enemy.behavior !== 'engaging' && enemy.behavior !== 'attacking') {
    return false;
  }
  return enemyOverlapsArmyFootprint(enemy.x, enemy.z, enemy.radius, footprint);
}

/** World-X offsets from armyX for enemies currently brawling with the crowd. */
export function getContactEnemyOffsetXs(state: GameState): number[] {
  const footprint = buildArmyFootprintForState(state);
  if (footprint.length === 0) {
    return [];
  }

  const offsets: number[] = [];
  for (let i = 0; i < state.enemies.length; i += 1) {
    const enemy = state.enemies[i];
    if (!enemy?.active || enemy.dying) {
      continue;
    }
    if (!isEnemyInArmyContact(enemy, footprint)) {
      continue;
    }
    offsets.push(enemy.x - state.armyX);
  }
  return offsets;
}

export function hasContactEnemies(state: GameState): boolean {
  return getContactEnemyOffsetXs(state).length > 0;
}
