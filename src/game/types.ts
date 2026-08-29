import type { CombatState } from './entities/combat';
import type { BossRuntimeState } from './entities/boss';
import type { GateRuntimeState } from './entities/gates';
import type { HazardRuntimeState } from './entities/hazards';
import type { WorldRuntimeState } from './world/worldState';
import type { FormationSlot, DyingSoldierVisual } from './army/formation';
import type { WeaponId } from './config/weapons';

export type LaneIndex = 0 | 1 | 2;

export type GameStatus = 'running' | 'paused' | 'gameover';

export interface GameState extends CombatState, GateRuntimeState, BossRuntimeState, HazardRuntimeState, WorldRuntimeState {
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
  slamBurst: number;
  slamBurstX: number;
  slamBurstZ: number;
  explosionBurst: number;
  explosionBurstX: number;
  explosionBurstZ: number;
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
  weaponId: WeaponId;
  weaponName: string;
  fps: number;
  elapsed: number;
  hasChangedLane: boolean;
  difficulty: number;
  nextBossDistance: number;
  nextBossKillThreshold: number;
  enemiesKilled: number;
  runSeed: number;
  segmentKind: string;
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
