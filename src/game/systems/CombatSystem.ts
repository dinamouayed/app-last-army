import type { GameState } from '../types';
import { updateArmyVisuals } from './ArmySystem';
import { resolveProjectileEnemyCollisions } from './CollisionSystem';
import { updateEnemies, updateParticles } from './EnemySystem';
import { updateGates } from './GateSystem';
import { updateProjectiles } from './ProjectileSystem';
import { updateShooting } from './ShootingSystem';
import { updateSpawn } from './SpawnSystem';

export function updateCombat(
  state: GameState,
  dt: number,
  rng: () => number = Math.random,
): void {
  if (state.status !== 'running') {
    return;
  }
  updateGates(state, dt, rng);
  updateSpawn(state, dt, rng);
  updateShooting(state, dt);
  updateProjectiles(state, dt);
  updateEnemies(state, dt);
  resolveProjectileEnemyCollisions(state);
  updateArmyVisuals(state, dt);
  updateParticles(state, dt);
}
