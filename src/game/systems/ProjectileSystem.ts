import { GAME_CONFIG } from '../config/game';
import type { GameState } from '../types';

export function updateProjectiles(state: GameState, dt: number): void {
  const farZ = state.distance + GAME_CONFIG.camera.zFar;
  const clipZ = state.distance + GAME_CONFIG.camera.zClip;

  for (let i = 0; i < state.projectiles.length; i += 1) {
    const projectile = state.projectiles[i];
    if (!projectile?.active) {
      continue;
    }
    projectile.prevX = projectile.x;
    projectile.prevZ = projectile.z;
    projectile.z += projectile.speed * dt;
    if (projectile.z > farZ || projectile.z < clipZ) {
      projectile.active = false;
    }
  }
}
