import type { GameState } from '../types';
import { updateArmyVisuals } from './ArmySystem';
import { updateBoss } from './BossSystem';
import { updateBossTapStrike } from './BossTapStrikeSystem';
import { resolveProjectileEnemyCollisions } from './CollisionSystem';
import { updateEnemies, updateParticles } from './EnemySystem';
import { updateGates } from './GateSystem';
import { updateHazards } from './HazardSystem';
import { updateProjectiles } from './ProjectileSystem';
import { updateShooting } from './ShootingSystem';
import { updateWorld } from './WorldGenerator';

export function updateCombat(
  state: GameState,
  dt: number,
  rng?: () => number,
): void {
  if (state.status !== 'running') {
    return;
  }
  updateBoss(state, dt);
  updateBossTapStrike(state, dt);
  updateWorld(state, dt, rng);
  updateGates(state, dt, rng);
  updateHazards(state, dt);
  updateShooting(state, dt);
  updateProjectiles(state, dt);
  updateEnemies(state, dt);
  resolveProjectileEnemyCollisions(state);
  updateArmyVisuals(state, dt);
  updateParticles(state, dt);
}
