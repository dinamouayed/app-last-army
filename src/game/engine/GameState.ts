import { refreshFormation } from '../army/armyState';
import { createDyingVisualPool, createFormationBuffer } from '../army/formation';
import { COMBAT_CONFIG } from '../config/combat';
import { GAME_CONFIG } from '../config/game';
import { createGateRuntimeState } from '../entities/gates';
import { createBossRuntimeState } from '../entities/boss';
import { STARTING_WEAPON } from '../config/weapons';
import { laneIndexToX } from '../math/lanes';
import type { GameState } from '../types';
import { scheduleFirstGate } from '../systems/GateSystem';
import { scheduleFirstBoss } from '../systems/BossSystem';
import { initWorld } from '../systems/WorldGenerator';
import { createWorldRuntimeState } from '../world/worldState';

export function createGameState(seed?: number): GameState {
  const armyX = laneIndexToX(GAME_CONFIG.startingLane, GAME_CONFIG.laneSpacing);

  const state: GameState = {
    status: 'running',
    elapsed: 0,
    distance: 0,
    armySize: GAME_CONFIG.startingArmySize,
    targetLane: GAME_CONFIG.startingLane,
    armyX,
    hasChangedLane: false,
    visibleCount: GAME_CONFIG.startingArmySize,
    formationBuiltFor: GAME_CONFIG.startingArmySize,
    formationSlots: createFormationBuffer(),
    armyHitFlash: 0,
    armyDeathPulse: 0,
    armyShake: 0,
    fireOriginIndex: 0,
    dyingVisuals: createDyingVisualPool(),
    weaponId: STARTING_WEAPON,
    unlockedWeapons: ['pistol'],
    fireAccumulator: 0,
    muzzleFlash: 0,
    contactPulse: 0,
    contactX: 0,
    contactZ: 0,
    spawnTimer: COMBAT_CONFIG.firstSpawnDelay,
    nextEntityId: 1,
    projectiles: [],
    enemies: [],
    particles: [],
    ...createGateRuntimeState(),
    ...createBossRuntimeState(),
    ...createWorldRuntimeState(seed),
  };

  scheduleFirstGate(state);
  scheduleFirstBoss(state);
  initWorld(state);
  refreshFormation(state);
  return state;
}
