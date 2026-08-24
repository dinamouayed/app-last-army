import { addSoldiers, removeSoldiers, setArmySize } from '../army/armyState';
import { GAME_CONFIG } from '../config/game';
import { createGameState } from '../engine/GameState';
import {
  beginLaneGesture,
  endLaneGesture,
  updateLaneGesture,
} from '../math/lanes';
import { updateCombat } from '../systems/CombatSystem';
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
}
