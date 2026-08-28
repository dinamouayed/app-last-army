import { removeSoldiersAtContact } from '../army/armyState';
import {
  armyFrontWorldZ,
  buildArmyFootprint,
  buildFootprintFromSlots,
  closestPointOnArmyFootprint,
  enemyOverlapsArmyFootprint,
  enemyWouldEnterFootprint,
  nearestFootprintDistance,
  snapEnemyToArmyContact,
} from '../army/footprint';
import { COMBAT_CONFIG } from '../config/combat';
import { ENEMIES, getEnemyConfig } from '../config/enemies';
import { GAME_CONFIG } from '../config/game';
import { scaledEnemyApproachSpeed, scaledEnemyEngagingSpeed, scaledEnemyHp } from '../config/difficulty';
import { acquireEntity, livingEnemyCount } from '../entities/combat';
import type { Enemy, Particle } from '../entities/combat';
import { playerWorldZ } from '../math/camera';
import { asphaltLaneCenterX, asphaltLaneWidth, clampWorldXToRoad } from '../math/roadBounds';
import type { GameState, LaneIndex } from '../types';

function nextId(state: GameState): number {
  const id = state.nextEntityId;
  state.nextEntityId += 1;
  return id;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function enemyRoadMargin(): number {
  return COMBAT_CONFIG.enemyRoadMargin + COMBAT_CONFIG.enemyVisualHalfWidth;
}

function deriveLaneFromX(worldX: number): LaneIndex {
  const halfLane = asphaltLaneWidth(GAME_CONFIG.camera) * 0.5;
  if (worldX < -halfLane) {
    return 0;
  }
  if (worldX > halfLane) {
    return 2;
  }
  return 1;
}

function clampEnemyToRoad(enemy: Enemy): void {
  enemy.x = clampWorldXToRoad(enemy.x, GAME_CONFIG.camera, enemyRoadMargin());
}

function keepEnemyAheadOfArmy(enemy: Enemy, frontZ: number): void {
  const minZ = enemy.behavior === 'attacking' ? frontZ - enemy.radius * 0.2 : frontZ;
  if (enemy.z < minZ) {
    enemy.z = minZ;
  }
}

function getArmyFootprint(state: GameState, playerZ: number) {
  const fromSlots = buildFootprintFromSlots(
    state.armyX,
    playerZ,
    state.formationSlots,
  );
  if (fromSlots.length > 0) {
    return fromSlots;
  }
  return buildArmyFootprint(state.armySize, state.armyX, playerZ);
}

function shouldBeginEngaging(
  enemy: Enemy,
  playerZ: number,
  footprint: ReturnType<typeof getArmyFootprint>,
  config: ReturnType<typeof getEnemyConfig>,
  armySize: number,
): boolean {
  if (armySize <= 0) {
    return false;
  }
  const footprintDist = nearestFootprintDistance(enemy.x, enemy.z, footprint);
  if (footprintDist <= config.engagementStartDistance) {
    return true;
  }
  const depthGap = enemy.z - playerZ;
  return depthGap <= config.nearCombatDepth && footprintDist <= config.engagementStartDistance * 1.35;
}

export function spawnBasicEnemyAt(
  state: GameState,
  worldX: number,
  worldZ: number,
): Enemy | null {
  const config = ENEMIES.basic;
  const hp = scaledEnemyHp(state.distance, config.maxHp);
  const enemy = acquireEntity(state.enemies, COMBAT_CONFIG.maxEnemies, () => ({
    id: 0,
    active: false,
    kind: 'basic' as const,
    lane: 1 as LaneIndex,
    x: 0,
    z: 0,
    hp: 0,
    maxHp: 0,
    radius: config.collisionRadius,
    hitFlash: 0,
    deathT: 0,
    dying: false,
    behavior: 'approaching' as const,
    attackTimer: 0,
    approachSpeed: config.approachSpeed,
    engagingForwardSpeed: config.engagingForwardSpeed,
  }));
  if (!enemy) {
    return null;
  }

  enemy.id = nextId(state);
  enemy.active = true;
  enemy.kind = 'basic';
  enemy.x = clampWorldXToRoad(worldX, GAME_CONFIG.camera, enemyRoadMargin());
  enemy.lane = deriveLaneFromX(enemy.x);
  enemy.z = worldZ;
  enemy.hp = hp;
  enemy.maxHp = hp;
  enemy.radius = config.collisionRadius;
  enemy.hitFlash = 0;
  enemy.deathT = 0;
  enemy.dying = false;
  enemy.behavior = 'approaching';
  enemy.attackTimer = config.attackInterval;
  enemy.approachSpeed = scaledEnemyApproachSpeed(state.distance, config.approachSpeed);
  enemy.engagingForwardSpeed = scaledEnemyEngagingSpeed(state.distance, config.engagingForwardSpeed);
  return enemy;
}

export function spawnBasicEnemy(
  state: GameState,
  lane: LaneIndex,
  worldZ: number,
  xJitter = 0,
): Enemy | null {
  const worldX = asphaltLaneCenterX(lane, GAME_CONFIG.camera) + xJitter;
  return spawnBasicEnemyAt(state, worldX, worldZ);
}

export function spawnDeathParticles(state: GameState, x: number, z: number): void {
  const offsets = [
    [0.18, 0.12],
    [-0.16, 0.2],
    [0.08, -0.14],
    [-0.1, 0.05],
    [0.22, -0.08],
  ] as const;
  for (let i = 0; i < offsets.length; i += 1) {
    const offset = offsets[i];
    if (!offset) {
      continue;
    }
    const particle = acquireEntity(state.particles, COMBAT_CONFIG.maxParticles, () => ({
      active: false,
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      life: 0,
      maxLife: COMBAT_CONFIG.particleLife,
      kind: 'default' as const,
    } satisfies Particle));
    if (!particle) {
      return;
    }
    particle.active = true;
    particle.x = x;
    particle.z = z;
    particle.vx = offset[0] * 8;
    particle.vz = offset[1] * 8;
    particle.life = COMBAT_CONFIG.particleLife;
    particle.maxLife = COMBAT_CONFIG.particleLife;
  }
}

export function killEnemy(state: GameState, enemy: Enemy): void {
  if (enemy.dying) {
    return;
  }
  enemy.hp = 0;
  enemy.dying = true;
  enemy.deathT = 0;
  enemy.behavior = 'approaching';
  state.enemiesKilled += 1;
  spawnDeathParticles(state, enemy.x, enemy.z);
}

function applyLateralSteer(
  enemy: Enemy,
  targetX: number,
  dt: number,
  config: ReturnType<typeof getEnemyConfig>,
  strength = 1,
): void {
  const dx = targetX - enemy.x;
  const steer = dx * config.lateralSteeringSpeed * strength * dt;
  const maxStep = config.maxLateralSpeed * dt;
  enemy.x += clamp(steer, -maxStep, maxStep);
  clampEnemyToRoad(enemy);
}

function beginAttacking(
  enemy: Enemy,
  footprint: ReturnType<typeof getArmyFootprint>,
  config: ReturnType<typeof getEnemyConfig>,
): void {
  const snapped = snapEnemyToArmyContact(
    enemy.x,
    enemy.z,
    enemy.radius,
    footprint,
  );
  enemy.x = snapped.x;
  enemy.z = snapped.z;
  enemy.behavior = 'attacking';
  enemy.attackTimer = config.attackInterval * 0.35;
  clampEnemyToRoad(enemy);
}

function updateApproachingEnemy(
  state: GameState,
  enemy: Enemy,
  dt: number,
  playerZ: number,
  config: ReturnType<typeof getEnemyConfig>,
  footprint: ReturnType<typeof getArmyFootprint>,
): void {
  if (shouldBeginEngaging(enemy, playerZ, footprint, config, state.armySize)) {
    enemy.behavior = 'engaging';
    return;
  }

  const nextZ = enemy.z - (enemy.approachSpeed || config.approachSpeed) * dt;
  if (
    state.armySize > 0 &&
    enemyWouldEnterFootprint(enemy.x, enemy.z, nextZ, enemy.radius, footprint)
  ) {
    beginAttacking(enemy, footprint, config);
    return;
  }

  enemy.z = nextZ;
}

function updateEngagingEnemy(
  state: GameState,
  enemy: Enemy,
  dt: number,
  playerZ: number,
  config: ReturnType<typeof getEnemyConfig>,
  footprint: ReturnType<typeof getArmyFootprint>,
): void {
  if (state.armySize <= 0) {
    enemy.behavior = 'approaching';
    return;
  }

  const target = closestPointOnArmyFootprint(enemy.x, enemy.z, footprint);
  applyLateralSteer(enemy, target.x, dt, config, 1);

  const nextZ = enemy.z - (enemy.engagingForwardSpeed || config.engagingForwardSpeed) * dt;
  if (enemyWouldEnterFootprint(enemy.x, enemy.z, nextZ, enemy.radius, footprint)) {
    beginAttacking(enemy, footprint, config);
    return;
  }

  if (enemyOverlapsArmyFootprint(enemy.x, enemy.z, enemy.radius, footprint)) {
    beginAttacking(enemy, footprint, config);
    return;
  }

  enemy.z = nextZ;

  const depthGap = enemy.z - playerZ;
  if (depthGap <= config.nearCombatDepth) {
    applyLateralSteer(enemy, target.x, dt, config, 0.65);
    if (depthGap < -0.15) {
      enemy.z = Math.min(enemy.z + config.engagingForwardSpeed * 0.35 * dt, playerZ + 0.05);
    }
  }
}

function updateAttackingEnemy(
  state: GameState,
  enemy: Enemy,
  dt: number,
  config: ReturnType<typeof getEnemyConfig>,
  footprint: ReturnType<typeof getArmyFootprint>,
): void {
  if (state.armySize <= 0) {
    enemy.behavior = 'approaching';
    return;
  }

  const snapped = snapEnemyToArmyContact(
    enemy.x,
    enemy.z,
    enemy.radius,
    footprint,
  );
  enemy.x = snapped.x;
  enemy.z = snapped.z;
  clampEnemyToRoad(enemy);

  if (!enemyOverlapsArmyFootprint(enemy.x, enemy.z, enemy.radius, footprint)) {
    enemy.behavior = 'engaging';
    return;
  }

  enemy.attackTimer -= dt;
  if (enemy.attackTimer <= 0) {
    removeSoldiersAtContact(
      state,
      config.armyDamagePerAttack,
      enemy.x,
      enemy.z,
    );
    enemy.attackTimer = config.attackInterval;
  }
}

export function updateEnemies(state: GameState, dt: number): void {
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const frontZ = armyFrontWorldZ(playerZ, state.formationSlots);
  let footprint = getArmyFootprint(state, playerZ);

  for (let i = 0; i < state.enemies.length; i += 1) {
    const enemy = state.enemies[i];
    if (!enemy?.active) {
      continue;
    }

    if (enemy.hitFlash > 0) {
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    }

    if (enemy.dying) {
      enemy.deathT += dt;
      if (enemy.deathT >= COMBAT_CONFIG.deathDuration) {
        enemy.active = false;
      }
      continue;
    }

    const config = getEnemyConfig(enemy.kind);

    if (enemy.behavior === 'attacking') {
      updateAttackingEnemy(state, enemy, dt, config, footprint);
    } else if (enemy.behavior === 'engaging') {
      updateEngagingEnemy(state, enemy, dt, playerZ, config, footprint);
    } else {
      updateApproachingEnemy(state, enemy, dt, playerZ, config, footprint);
    }

    clampEnemyToRoad(enemy);
    keepEnemyAheadOfArmy(enemy, frontZ);
    footprint = getArmyFootprint(state, playerZ);
  }
}

export function updateParticles(state: GameState, dt: number): void {
  if (state.contactPulse > 0) {
    state.contactPulse = Math.max(0, state.contactPulse - dt);
  }

  for (let i = 0; i < state.particles.length; i += 1) {
    const particle = state.particles[i];
    if (!particle?.active) {
      continue;
    }
    particle.x += particle.vx * dt;
    particle.z += particle.vz * dt;
    particle.life -= dt;
    if (particle.life <= 0) {
      particle.active = false;
    }
  }
}

export { livingEnemyCount };
