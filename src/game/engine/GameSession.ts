import { addSoldiers, removeSoldiers, setArmySize } from '../army/armyState';
import { GAME_CONFIG } from '../config/game';
import { createGameState } from '../engine/GameState';
import {
  beginLaneGesture,
  endLaneGesture,
  updateLaneGesture,
} from '../math/lanes';
import { updateArmyVisuals } from '../systems/ArmySystem';
import { updateCombat } from '../systems/CombatSystem';
import { spawnBossForDev } from '../systems/BossSystem';
import { updateParticles } from '../systems/EnemySystem';
import { resyncWorldAfterDistanceJump } from '../systems/WorldGenerator';
import { updateRunner } from '../systems/RunnerSystem';
import type { GameState, InputState } from '../types';

export class GameSession {
  state: GameState;
  input: InputState;
  gameOverNotified = false;

  constructor() {
    this.state = createGameState();
    this.input = {
      gestureDx: 0,
      laneSwipeLocked: false,
    };
  }

  update(dt: number): void {
    updateRunner(this.state, dt, GAME_CONFIG);
    updateCombat(this.state, dt);
  }

  /** Keep the TNT fireball and death debris moving after the run has ended. */
  updateDeathFx(dt: number): void {
    updateArmyVisuals(this.state, dt);
    updateParticles(this.state, dt);
  }

  beginSwipe(): void {
    beginLaneGesture(this.input);
  }

  updateSwipe(gestureDx: number): void {
    updateLaneGesture(
      this.state,
      this.input,
      gestureDx,
      GAME_CONFIG.swipeThresholdPx,
    );
  }

  endSwipe(): void {
    endLaneGesture(this.state, this.input, GAME_CONFIG.swipeThresholdPx);
  }

  devAddSoldiers(amount: number): void {
    addSoldiers(this.state, amount);
  }

  devRemoveSoldiers(amount: number): void {
    removeSoldiers(this.state, amount);
  }

  devSetArmySize(size: number): void {
    setArmySize(this.state, size);
  }

  devSpawnBoss(): void {
    spawnBossForDev(this.state);
  }

  devAdvanceDistance(amount: number): void {
    if (this.state.status !== 'running') {
      return;
    }
    this.state.distance += Math.max(0, amount);
    resyncWorldAfterDistanceJump(this.state);
  }
}
