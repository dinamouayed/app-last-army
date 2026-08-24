import { ARMY_CONFIG } from '../config/army';
import type { GameState } from '../types';

export function updateArmyVisuals(state: GameState, dt: number): void {
  if (state.armyHitFlash > 0) {
    state.armyHitFlash = Math.max(0, state.armyHitFlash - dt);
  }
  if (state.armyDeathPulse > 0) {
    state.armyDeathPulse = Math.max(0, state.armyDeathPulse - dt);
  }
  if (state.armyShake > 0) {
    state.armyShake = Math.max(0, state.armyShake - dt);
  }

  for (let i = 0; i < state.dyingVisuals.length; i += 1) {
    const visual = state.dyingVisuals[i];
    if (!visual?.active) {
      continue;
    }
    visual.t += dt;
    if (visual.t >= ARMY_CONFIG.soldierDeathDuration) {
      visual.active = false;
      visual.t = 0;
    }
  }
}
