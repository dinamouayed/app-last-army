import { addSoldiers, removeSoldiersAtContact } from '../army/armyState';
import { armyFrontWorldZ } from '../army/footprint';
import {
  BOSS_CONFIG,
  bossAttackInterval,
  bossMaxHpForDistance,
  bossSlamDamageForEncounter,
} from '../config/bosses';
import { COMBAT_CONFIG } from '../config/combat';
import { isGateSegmentKind } from '../config/difficulty';
import { GAME_CONFIG } from '../config/game';
import { acquireEntity } from '../entities/combat';
import type { Particle } from '../entities/combat';
import { resetTapStrike, type Boss } from '../entities/boss';
import { playerWorldZ } from '../math/camera';
import { asphaltLaneCenterX } from '../math/roadBounds';
import { recycleSegment } from '../world/worldState';
import { clearGatesNearWorldZ } from './GateSystem';
import { clearHazardsNearWorldZ, spawnExplosionBurst } from './HazardSystem';
import type { GameState } from '../types';

function resolveBossSpawnDistance(state: GameState, candidate: number): number {
  if (state.nextGateDistance <= 0) {
    return candidate;
  }
  const separation = BOSS_CONFIG.minGateDistanceSeparation;
  if (Math.abs(candidate - state.nextGateDistance) < separation) {
    return state.nextGateDistance + separation;
  }
  return candidate;
}

function reserveGateSpawnAfterBoss(state: GameState): void {
  state.nextGateDistance = Math.max(
    state.nextGateDistance,
    state.distance + BOSS_CONFIG.minGateDistanceSeparation,
  );
}

function nextId(state: GameState): number {
  const id = state.nextEntityId;
  state.nextEntityId += 1;
  return id;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function scheduleFirstBoss(state: GameState): void {
  state.nextBossKillThreshold = BOSS_CONFIG.firstBossKills;
  state.nextBossDistance = 0;
}

function isBossArmed(state: GameState): boolean {
  return state.nextBossDistance > 0;
}

/** Arm a nearby BossApproach once the kill threshold is met. */
export function tryScheduleBossFromKills(state: GameState): void {
  if (state.boss.active) {
    return;
  }
  if (isBossArmed(state)) {
    return;
  }
  if (state.enemiesKilled < state.nextBossKillThreshold) {
    return;
  }

  const keepUntil = state.distance + 16;
  for (let i = 0; i < state.segments.length; i += 1) {
    const segment = state.segments[i];
    if (segment?.active && segment.startDistance >= keepUntil) {
      recycleSegment(segment);
    }
  }

  let frontier = Math.max(state.distance, keepUntil);
  let lastKind = state.lastSegmentKind;
  for (let i = 0; i < state.segments.length; i += 1) {
    const segment = state.segments[i];
    if (!segment?.active) {
      continue;
    }
    frontier = Math.max(frontier, segment.startDistance + segment.length);
    lastKind = segment.kind;
  }
  state.worldFrontier = frontier;
  state.lastSegmentKind = lastKind;
  state.sameKindStreak = lastKind ? 1 : 0;

  let nextGate = Number.POSITIVE_INFINITY;
  for (let i = 0; i < state.segments.length; i += 1) {
    const segment = state.segments[i];
    if (!segment?.active || segment.materialized || !isGateSegmentKind(segment.kind)) {
      continue;
    }
    nextGate = Math.min(nextGate, segment.startDistance);
  }
  state.nextGateDistance = Number.isFinite(nextGate) ? nextGate : 0;

  state.nextBossDistance = resolveBossSpawnDistance(
    state,
    frontier + BOSS_CONFIG.approachDistance,
  );
}

function syncBossWorldZ(state: GameState, boss: Boss): void {
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const frontZ = armyFrontWorldZ(playerZ, state.formationSlots);
  boss.z = frontZ + boss.depthOffset;
}

function spawnBossDeathParticles(state: GameState, x: number, z: number): void {
  const count = BOSS_CONFIG.deathParticleCount;
  for (let i = 0; i < count; i += 1) {
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
    const angle = (i / count) * Math.PI * 2;
    const speed = 7 + (i % 4) * 2.2;
    particle.active = true;
    particle.x = x + Math.cos(angle) * 0.2;
    particle.z = z + Math.sin(angle) * 0.16;
    particle.vx = Math.cos(angle) * speed;
    particle.vz = Math.sin(angle) * speed * 0.85;
    particle.life = COMBAT_CONFIG.particleLife * 1.45;
    particle.maxLife = COMBAT_CONFIG.particleLife * 1.45;
  }
}

function spawnSlamImpactParticles(state: GameState, x: number, z: number): void {
  const burstCount = 18;
  for (let i = 0; i < burstCount; i += 1) {
    const particle = acquireEntity(state.particles, COMBAT_CONFIG.maxParticles, () => ({
      active: false,
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      life: 0,
      maxLife: COMBAT_CONFIG.particleLife,
      kind: 'slam' as const,
    } satisfies Particle));
    if (!particle) {
      return;
    }
    const angle = (i / burstCount) * Math.PI * 2 + (i % 3) * 0.22;
    const speed = 6 + (i % 5) * 2.4;
    particle.active = true;
    particle.x = x + Math.cos(angle) * 0.12;
    particle.z = z + Math.sin(angle) * 0.1;
    particle.vx = Math.cos(angle) * speed;
    particle.vz = Math.sin(angle) * speed * 0.75 - 1.5;
    particle.life = COMBAT_CONFIG.particleLife * 1.15;
    particle.maxLife = COMBAT_CONFIG.particleLife * 1.15;
  }
}

export function spawnBoss(
  state: GameState,
  options?: { dev?: boolean },
): Boss | null {
  if (state.boss.active && !options?.dev) {
    return null;
  }

  const boss = state.boss;
  if (options?.dev) {
    boss.active = false;
    boss.dying = false;
    boss.deathT = 0;
  } else if (boss.active) {
    return null;
  }

  const maxHp = bossMaxHpForDistance(state.distance);
  const encounterIndex = state.bossEncounterCount;

  boss.id = nextId(state);
  boss.active = true;
  boss.x = asphaltLaneCenterX(1, GAME_CONFIG.camera);
  boss.depthOffset = options?.dev
    ? BOSS_CONFIG.devSpawnDepthOffset
    : BOSS_CONFIG.spawnDepthOffset;
  syncBossWorldZ(state, boss);
  boss.hp = maxHp;
  boss.maxHp = maxHp;
  boss.radius = BOSS_CONFIG.collisionRadius;
  boss.hitFlash = 0;
  boss.deathT = 0;
  boss.dying = false;
  boss.behavior = 'approaching';
  boss.attackPhase = 'idle';
  boss.attackPhaseT = 0;
  boss.attackCooldown = bossAttackInterval(encounterIndex) * (options?.dev ? 0.85 : 0.35);
  boss.slamDamage = bossSlamDamageForEncounter(state.distance, encounterIndex, state.armySize);
  boss.slamDamageApplied = false;
  boss.animTime = 0;
  clearGatesNearWorldZ(state, boss.z, BOSS_CONFIG.gateClearanceZ);
  clearHazardsNearWorldZ(state, boss.z, BOSS_CONFIG.gateClearanceZ);
  reserveGateSpawnAfterBoss(state);
  state.bossEncounterCount += 1;
  resetTapStrike(state.tapStrike);
  state.tapStrike.hintT = BOSS_CONFIG.tapHintDuration;
  return boss;
}

/** Dev-only — respawns the boss close to the army with a safe test army size. */
export function spawnBossForDev(state: GameState): Boss | null {
  if (state.status !== 'running') {
    return null;
  }
  if (state.armySize < BOSS_CONFIG.devSpawnMinArmy) {
    addSoldiers(state, BOSS_CONFIG.devSpawnMinArmy - state.armySize);
  }
  return spawnBoss(state, { dev: true });
}

export function killBoss(state: GameState, boss: Boss): void {
  if (boss.dying) {
    return;
  }
  boss.hp = 0;
  boss.dying = true;
  boss.deathT = 0;
  boss.behavior = 'approaching';
  boss.attackPhase = 'idle';
  spawnBossDeathParticles(state, boss.x, boss.z);
  state.pendingRecovery = true;
}

export function applyProjectileBossHit(state: GameState, damage: number): void {
  const boss = state.boss;
  if (!boss.active || boss.dying) {
    return;
  }
  boss.hp -= damage;
  boss.hitFlash = Math.max(boss.hitFlash, BOSS_CONFIG.hitFlashDuration);
  if (boss.hp <= 0) {
    killBoss(state, boss);
  }
}

function bossEncounterIndex(state: GameState): number {
  return Math.max(0, state.bossEncounterCount - 1);
}

function executeSlam(state: GameState, boss: Boss): void {
  const damage = bossSlamDamageForEncounter(
    state.distance,
    bossEncounterIndex(state),
    state.armySize,
  );
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const frontZ = armyFrontWorldZ(playerZ, state.formationSlots);
  const impactZ = (frontZ + playerZ) * 0.5;
  boss.slamDamage = damage;
  removeSoldiersAtContact(state, damage, boss.x, impactZ);
  spawnSlamImpactParticles(state, boss.x, impactZ);
  state.slamBurst = BOSS_CONFIG.slamBurstDuration;
  state.slamBurstX = boss.x;
  state.slamBurstZ = impactZ;
  state.armyShake = BOSS_CONFIG.slamShakeDuration;
  state.contactPulse = COMBAT_CONFIG.contactPulseDuration * 1.85;
  state.contactX = boss.x;
  state.contactZ = impactZ;
  if (state.status === 'gameover') {
    spawnExplosionBurst(state, state.armyX, impactZ);
  }
}

function updateApproachingBoss(state: GameState, boss: Boss, dt: number): void {
  boss.depthOffset = Math.max(
    BOSS_CONFIG.fightDepthOffset,
    boss.depthOffset - BOSS_CONFIG.closureSpeed * dt,
  );
  syncBossWorldZ(state, boss);

  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const targetX = state.armyX;
  const dx = targetX - boss.x;
  boss.x += clamp(dx * 2.4 * dt, -BOSS_CONFIG.collisionRadius, BOSS_CONFIG.collisionRadius);

  if (boss.depthOffset <= BOSS_CONFIG.fightDepthOffset + 0.05) {
    boss.behavior = 'fighting';
    boss.depthOffset = BOSS_CONFIG.fightDepthOffset;
    boss.attackPhase = 'hold';
    boss.attackPhaseT = BOSS_CONFIG.holdBeforeAttack;
    syncBossWorldZ(state, boss);
  }

  void playerZ;
}

function slamHoldElapsed(boss: Boss): number {
  return BOSS_CONFIG.slamHoldDuration - boss.attackPhaseT;
}

function updateSlamHoldDamage(state: GameState, boss: Boss): void {
  if (boss.attackPhase !== 'slamHold' || boss.slamDamageApplied) {
    return;
  }
  if (slamHoldElapsed(boss) + 1e-4 < BOSS_CONFIG.slamImpactPause) {
    return;
  }
  executeSlam(state, boss);
  boss.slamDamageApplied = true;
}

function advanceAttackPhase(state: GameState, boss: Boss): void {
  if (boss.attackPhaseT > 0) {
    return;
  }

  switch (boss.attackPhase) {
    case 'hold':
      boss.attackPhase = 'windup';
      boss.attackPhaseT = BOSS_CONFIG.windupRaiseDuration;
      break;
    case 'windup':
      if (BOSS_CONFIG.windupHoldDuration > 0) {
        boss.attackPhase = 'windupHold';
        boss.attackPhaseT = BOSS_CONFIG.windupHoldDuration;
      } else {
        boss.attackPhase = 'slam';
        boss.attackPhaseT = BOSS_CONFIG.slamDuration;
      }
      break;
    case 'windupHold':
      boss.attackPhase = 'slam';
      boss.attackPhaseT = BOSS_CONFIG.slamDuration;
      break;
    case 'slam':
      boss.attackPhase = 'slamHold';
      boss.attackPhaseT = BOSS_CONFIG.slamHoldDuration;
      boss.slamDamageApplied = false;
      break;
    case 'slamHold':
      boss.attackPhase = 'recover';
      boss.attackPhaseT = BOSS_CONFIG.recoverDuration;
      break;
    case 'recover':
      boss.attackPhase = 'recoverHold';
      boss.attackPhaseT = BOSS_CONFIG.recoverHoldDuration;
      break;
    case 'recoverHold':
      boss.attackPhase = 'idle';
      boss.attackCooldown = bossAttackInterval(bossEncounterIndex(state));
      break;
    default:
      break;
  }
}

function updateFightingBoss(state: GameState, boss: Boss, dt: number): void {
  boss.depthOffset = BOSS_CONFIG.fightDepthOffset;
  syncBossWorldZ(state, boss);

  const dx = state.armyX - boss.x;
  boss.x += clamp(dx * 1.8 * dt, -0.35 * dt, 0.35 * dt);

  if (boss.attackPhase === 'idle') {
    boss.attackCooldown -= dt;
    if (boss.attackCooldown <= 0) {
      boss.attackPhase = 'hold';
      boss.attackPhaseT = BOSS_CONFIG.holdBeforeAttack;
    }
    return;
  }

  updateSlamHoldDamage(state, boss);
  boss.attackPhaseT -= dt;
  advanceAttackPhase(state, boss);
}

function updateBossSpawn(state: GameState): void {
  if (state.boss.active) {
    return;
  }
  if (!isBossArmed(state) || state.distance < state.nextBossDistance) {
    return;
  }
  spawnBoss(state);
}

function updateLivingBoss(state: GameState, dt: number): void {
  const boss = state.boss;
  if (!boss.active || boss.dying) {
    return;
  }

  if (boss.hitFlash > 0) {
    boss.hitFlash = Math.max(0, boss.hitFlash - dt);
  }

  if (state.slamBurst > 0) {
    state.slamBurst = Math.max(0, state.slamBurst - dt);
  }

  boss.animTime += dt;

  if (boss.behavior === 'fighting') {
    updateFightingBoss(state, boss, dt);
  } else {
    updateApproachingBoss(state, boss, dt);
  }
}

function updateBossDeath(state: GameState, dt: number): void {
  const boss = state.boss;
  if (!boss.active || !boss.dying) {
    return;
  }
  boss.deathT += dt;
  if (boss.deathT >= BOSS_CONFIG.deathDuration) {
    boss.active = false;
    state.nextBossKillThreshold = state.enemiesKilled + BOSS_CONFIG.bossKillInterval;
    state.nextBossDistance = 0;
  }
}

export function updateBoss(state: GameState, dt: number): void {
  updateBossSpawn(state);
  updateLivingBoss(state, dt);
  updateBossDeath(state, dt);
}

export function bossSlamWindupProgress(boss: Boss): number {
  if (boss.attackPhase === 'windup') {
    return phaseProgress(boss.attackPhaseT, BOSS_CONFIG.windupRaiseDuration);
  }
  if (boss.attackPhase === 'windupHold' || boss.attackPhase === 'slam' || boss.attackPhase === 'slamHold') {
    return 1;
  }
  return 0;
}

function phaseProgress(phaseT: number, duration: number): number {
  if (duration <= 0) {
    return 1;
  }
  return Math.max(0, Math.min(1, 1 - phaseT / duration));
}

export function bossSlamImpactProgress(boss: Boss): number {
  if (boss.attackPhase === 'slam') {
    return phaseProgress(boss.attackPhaseT, BOSS_CONFIG.slamDuration);
  }
  if (boss.attackPhase === 'slamHold') {
    return 1;
  }
  return 0;
}
