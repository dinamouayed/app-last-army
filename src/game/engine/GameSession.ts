import { GAME_CONFIG } from '../config/game';
import { createGameState } from '../engine/GameState';
import {
  beginLaneGesture,
  endLaneGesture,
  updateLaneGesture,
} from '../math/lanes';
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
}
