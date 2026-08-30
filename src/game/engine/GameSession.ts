import { addSoldiers, removeSoldiers, setArmySize } from '../army/armyState';
import { BOSS_CONFIG } from '../config/bosses';
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
import { registerBossTap } from '../systems/BossTapStrikeSystem';
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
      tapCandidate: false,
      gestureStartElapsed: 0,
    };
  }

  update(dt: number): void {
    updateRunner(this.state, dt, GAME_CONFIG);
    updateCombat(this.state, dt);
  }

  /** Keep the fireball, slam burst, and fading soldiers moving after the run has ended. */
  updateDeathFx(dt: number): void {
    this.state.elapsed += dt;
    if (this.state.slamBurst > 0) {
      this.state.slamBurst = Math.max(0, this.state.slamBurst - dt);
    }
    updateArmyVisuals(this.state, dt);
    updateParticles(this.state, dt);
  }

  beginSwipe(): void {
    beginLaneGesture(this.input);
    this.input.tapCandidate = true;
    this.input.gestureStartElapsed = this.state.elapsed;
  }

  updateSwipe(gestureDx: number): void {
    updateLaneGesture(
      this.state,
      this.input,
      gestureDx,
      GAME_CONFIG.swipeThresholdPx,
    );
    if (Math.abs(gestureDx) >= BOSS_CONFIG.tapCancelDxPx) {
      this.input.tapCandidate = false;
    }
  }

  endSwipe(): void {
    const hold = this.state.elapsed - this.input.gestureStartElapsed;
    const wasTap =
      this.input.tapCandidate
      && Math.abs(this.input.gestureDx) < BOSS_CONFIG.tapCancelDxPx
      && hold <= BOSS_CONFIG.tapMaxDuration;
    endLaneGesture(this.state, this.input, GAME_CONFIG.swipeThresholdPx);
    if (wasTap) {
      registerBossTap(this.state);
    }
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
