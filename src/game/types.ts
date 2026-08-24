import type { CombatState } from './entities/combat';
import type { GateRuntimeState } from './entities/gates';
import type { FormationSlot, DyingSoldierVisual } from './army/formation';

export type LaneIndex = 0 | 1 | 2;

export type GameStatus = 'running' | 'paused' | 'gameover';

export interface GameState extends CombatState, GateRuntimeState {
  status: GameStatus;
  elapsed: number;
  distance: number;
  armySize: number;
  targetLane: LaneIndex;
  armyX: number;
  hasChangedLane: boolean;
  visibleCount: number;
  formationBuiltFor: number;
  formationSlots: FormationSlot[];
  armyHitFlash: number;
  armyDeathPulse: number;
  armyShake: number;
  fireOriginIndex: number;
  dyingVisuals: DyingSoldierVisual[];
}

export interface InputState {
  gestureDx: number;
  laneSwipeLocked: boolean;
}

export interface HudSnapshot {
  distance: number;
  armySize: number;
  fps: number;
  elapsed: number;
  hasChangedLane: boolean;
}

export interface CameraConfig {
  playerDepth: number;
  zFar: number;
  zClip: number;
  horizonYRatio: number;
  playerYRatio: number;
  roadHalfWidth: number;
  nearRoadHalfWidthRatio: number;
}

export interface ScreenPoint {
  screenX: number;
  screenY: number;
  scale: number;
}
