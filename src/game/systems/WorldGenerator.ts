import { armyFrontWorldZ } from '../army/footprint';
import {
  DIFFICULTY_CONFIG,
  encounterComplexity,
  isEnemySegmentKind,
  isGateFollowupKind,
  isGateSegmentKind,
  pickEnemyGroupSize,
  scaledSpawnInterval,
  segmentLengthFor,
  waveGroupCount,
  type SegmentKind,
} from '../config/difficulty';
import { BOSS_CONFIG } from '../config/bosses';
import { COMBAT_CONFIG } from '../config/combat';
import { GAME_CONFIG } from '../config/game';
import { HAZARD_CONFIG } from '../config/hazards';
import { WEAPON_UNLOCK_CONFIG } from '../config/weaponUnlocks';
import { livingEnemyCount } from '../entities/combat';
import { isBossPresent } from '../entities/boss';
import { playerWorldZ } from '../math/camera';
import { nextMulberry32 } from '../math/rng';
import type { GameState, LaneIndex } from '../types';
import type { WorldSegment } from '../world/worldState';
import { acquireSegment, recycleSegment } from '../world/worldState';
import { type GateGenerationMode } from './GateGenerator';
import { clearGatesNearWorldZ, spawnGateChoice } from './GateSystem';
import { clearHazardsNearWorldZ, spawnHazardSet } from './HazardSystem';
import { tryScheduleBossFromKills } from './BossSystem';
import { minEnemySpawnZ, pickSpawnLane, spawnEnemyGroup } from './SpawnSystem';

const OPENING = DIFFICULTY_CONFIG.opening;

function worldRng(state: GameState): () => number {
  return () => nextMulberry32(state);
}

function resolveRng(state: GameState, rng?: () => number): () => number {
  return rng ?? worldRng(state);
}

function modeForSegment(kind: SegmentKind): GateGenerationMode {
  if (kind === 'ShootableGate') {
    return 'shootable';
  }
  if (kind === 'WeaponUnlock') {
    return 'weapon';
  }
  if (kind === 'RecoverySection') {
    return 'recovery';
  }
  if (kind === 'MixedEncounter') {
    return 'mixed';
  }
  return 'standard';
}

function nextSegmentId(state: GameState): number {
  const id = state.nextSegmentId;
  state.nextSegmentId += 1;
  return id;
}

function rememberKind(state: GameState, kind: SegmentKind): void {
  if (state.lastSegmentKind === kind) {
    state.sameKindStreak += 1;
  } else {
    state.lastSegmentKind = kind;
    state.sameKindStreak = 1;
  }
}

export function pushWorldSegment(
  state: GameState,
  kind: SegmentKind,
  startDistance: number,
  length: number,
): WorldSegment | null {
  const segment = acquireSegment(state);
  if (!segment) {
    return null;
  }
  segment.id = nextSegmentId(state);
  segment.active = true;
  segment.kind = kind;
  segment.startDistance = startDistance;
  segment.length = Math.max(8, length);
  segment.materialized = false;
  segment.waveRemaining = 0;
  segment.waveTimer = 0;
  rememberKind(state, kind);
  if (kind === 'WeaponUnlock') {
    state.lastWeaponDistance = startDistance;
  }
  if (kind === 'RecoverySection') {
    state.pendingRecovery = false;
  }
  state.worldFrontier = Math.max(state.worldFrontier, startDistance + segment.length);
  return segment;
}

export function activeSegments(state: GameState): WorldSegment[] {
  const live: WorldSegment[] = [];
  for (let i = 0; i < state.segments.length; i += 1) {
    const segment = state.segments[i];
    if (segment?.active) {
      live.push(segment);
    }
  }
  live.sort((a, b) => a.startDistance - b.startDistance);
  return live;
}

export function segmentAtDistance(state: GameState, distance: number): WorldSegment | null {
  const live = activeSegments(state);
  for (let i = 0; i < live.length; i += 1) {
    const segment = live[i]!;
    if (distance >= segment.startDistance && distance < segment.startDistance + segment.length) {
      return segment;
    }
  }
  return null;
}

export function currentSegment(state: GameState): WorldSegment | null {
  return segmentAtDistance(state, state.distance);
}

function recyclePassedSegments(state: GameState): void {
  const cutoff = state.distance - DIFFICULTY_CONFIG.recycleBehind;
  for (let i = 0; i < state.segments.length; i += 1) {
    const segment = state.segments[i];
    if (!segment?.active) {
      continue;
    }
    if (segment.startDistance + segment.length < cutoff) {
      recycleSegment(segment);
    }
  }
}

function bossApproachStart(state: GameState): number {
  if (state.nextBossDistance <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return state.nextBossDistance - DIFFICULTY_CONFIG.segmentLengths.BossApproach.min;
}

function hasActiveKind(state: GameState, kind: SegmentKind): boolean {
  for (let i = 0; i < state.segments.length; i += 1) {
    const segment = state.segments[i];
    if (segment?.active && segment.kind === kind) {
      return true;
    }
  }
  return false;
}

function weightForKind(
  state: GameState,
  kind: SegmentKind,
  complexity: number,
): number {
  let weight = DIFFICULTY_CONFIG.baseWeights[kind];
  if (kind === 'BossApproach') {
    return 0;
  }
  if (state.pendingRecovery) {
    return kind === 'RecoverySection' ? 1 : 0;
  }
  if (state.lastSegmentKind === kind && state.sameKindStreak >= DIFFICULTY_CONFIG.maxSameKindStreak) {
    return 0;
  }
  if (kind === 'MixedEncounter' && complexity < DIFFICULTY_CONFIG.mixedUnlockComplexity) {
    return 0;
  }
  if (kind === 'WeaponUnlock') {
    if (state.worldFrontier < WEAPON_UNLOCK_CONFIG.firstUnlockDistance) {
      return 0;
    }
    if (state.worldFrontier - state.lastWeaponDistance < DIFFICULTY_CONFIG.minWeaponSpacing) {
      return 0;
    }
  }
  if (kind === 'LaneHazard') {
    if (state.worldFrontier < HAZARD_CONFIG.firstHazardDistance) {
      return 0;
    }
    if (state.armySize <= DIFFICULTY_CONFIG.tinyArmySize) {
      return 0;
    }
    if (state.armySize <= DIFFICULTY_CONFIG.lowArmySize) {
      weight *= 0.4;
    }
  }
  if (state.armySize <= DIFFICULTY_CONFIG.tinyArmySize) {
    if (kind === 'RecoverySection') {
      weight *= 5;
    } else if (kind === 'EnemyWave' || kind === 'MixedEncounter') {
      weight *= 0.15;
    }
  } else if (state.armySize <= DIFFICULTY_CONFIG.lowArmySize) {
    if (kind === 'RecoverySection') {
      weight *= 3;
    } else if (kind === 'EnemyWave') {
      weight *= 0.4;
    } else if (kind === 'MixedEncounter') {
      weight *= 0.35;
    }
  }
  if (state.lastSegmentKind === 'EnemyWave' && state.armySize < 10 && kind === 'EnemyWave') {
    return 0;
  }
  if (state.lastSegmentKind === 'RecoverySection' && kind === 'RecoverySection') {
    return 0;
  }
  if (complexity < 0.12 && kind === 'ShootableGate') {
    weight *= 0.55;
  }
  return weight;
}

function pickSegmentKind(state: GameState, rng: () => number): SegmentKind {
  if (state.pendingRecovery) {
    return 'RecoverySection';
  }
  const complexity = encounterComplexity(state.worldFrontier);
  const kinds: SegmentKind[] = [
    'GateChoice',
    'EnemyWave',
    'ShootableGate',
    'WeaponUnlock',
    'MixedEncounter',
    'RecoverySection',
    'LaneHazard',
  ];
  let total = 0;
  const weights: number[] = [];
  for (let i = 0; i < kinds.length; i += 1) {
    const weight = weightForKind(state, kinds[i]!, complexity);
    weights.push(weight);
    total += weight;
  }
  if (total <= 0) {
    return 'GateChoice';
  }
  let roll = rng() * total;
  for (let i = 0; i < kinds.length; i += 1) {
    roll -= weights[i]!;
    if (roll <= 0) {
      return kinds[i]!;
    }
  }
  return kinds[kinds.length - 1]!;
}

function appendSegment(
  state: GameState,
  kind: SegmentKind,
  startDistance: number,
  rng: () => number,
  length = segmentLengthFor(kind, rng),
): WorldSegment | null {
  return pushWorldSegment(state, kind, startDistance, length);
}

function fillLookahead(state: GameState, rng: () => number): void {
  if (isBossPresent(state.boss)) {
    return;
  }

  const target = state.distance + DIFFICULTY_CONFIG.lookaheadDistance;
  let guard = 0;
  while (state.worldFrontier < target && guard < 16) {
    guard += 1;
    const approachStart = bossApproachStart(state);
    if (state.worldFrontier >= approachStart && state.nextBossDistance > state.worldFrontier) {
      if (!hasActiveKind(state, 'BossApproach')) {
        appendSegment(
          state,
          'BossApproach',
          state.worldFrontier,
          rng,
          state.nextBossDistance - state.worldFrontier,
        );
      }
      break;
    }

    const remainingToApproach = approachStart - state.worldFrontier;
    if (remainingToApproach < 40) {
      appendSegment(
        state,
        'BossApproach',
        state.worldFrontier,
        rng,
        Math.max(12, state.nextBossDistance - state.worldFrontier),
      );
      break;
    }

    const kind = pickSegmentKind(state, rng);
    const length = Math.min(segmentLengthFor(kind, rng), remainingToApproach);
    appendSegment(state, kind, state.worldFrontier, rng, length);
  }
}

function seedOpening(state: GameState): void {
  if (state.segments.some((segment) => segment.active)) {
    return;
  }
  state.worldFrontier = OPENING[0]?.startDistance ?? 20;
  for (let i = 0; i < OPENING.length; i += 1) {
    const spec = OPENING[i]!;
    pushWorldSegment(state, spec.kind, spec.startDistance, spec.length);
  }
  syncNextGateDistance(state);
}

export function initWorld(state: GameState, rng?: () => number): void {
  seedOpening(state);
  fillLookahead(state, resolveRng(state, rng));
  syncNextGateDistance(state);
}

export function syncNextGateDistance(state: GameState): void {
  let next = Number.POSITIVE_INFINITY;
  const live = activeSegments(state);
  for (let i = 0; i < live.length; i += 1) {
    const segment = live[i]!;
    if (!isGateSegmentKind(segment.kind) || segment.materialized) {
      continue;
    }
    if (segment.startDistance < next) {
      next = segment.startDistance;
    }
  }
  if (Number.isFinite(next)) {
    state.nextGateDistance = next;
    return;
  }
  state.nextGateDistance = Math.max(state.nextGateDistance, state.worldFrontier);
}

function enemySpawnZ(state: GameState, rng: () => number): number {
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const armyFrontZ = armyFrontWorldZ(playerZ, state.formationSlots);
  const minZ = minEnemySpawnZ(armyFrontZ);
  return Math.max(
    minZ,
    armyFrontZ +
      COMBAT_CONFIG.spawnAhead +
      (rng() - 0.5) * 2 * COMBAT_CONFIG.spawnJitter,
  );
}

function spawnWaveGroup(state: GameState, rng: () => number, lane?: LaneIndex): number {
  if (livingEnemyCount(state.enemies) >= COMBAT_CONFIG.maxEnemies) {
    return 0;
  }
  const count = pickEnemyGroupSize(state.distance, rng);
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const armyFrontZ = armyFrontWorldZ(playerZ, state.formationSlots);
  const minZ = minEnemySpawnZ(armyFrontZ);
  const spawnZ = enemySpawnZ(state, rng);
  const chosenLane = lane ?? pickSpawnLane(rng);
  return spawnEnemyGroup(state, count, spawnZ, chosenLane, rng, minZ);
}

function bestRewardLane(state: GameState): LaneIndex {
  let bestLane: LaneIndex = 1;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < state.gates.length; i += 1) {
    const gate = state.gates[i];
    if (!gate?.active || gate.activated) {
      continue;
    }
    let score = 0;
    if (gate.kind === 'weapon') {
      score = 6;
    } else if (gate.shootable) {
      score = gate.signedValue;
    } else if (gate.operation === 'add') {
      score = gate.value;
    } else if (gate.operation === 'multiply') {
      score = state.armySize * Math.max(0, gate.value - 1);
    } else if (gate.operation === 'divide') {
      score = Math.floor(state.armySize / Math.max(1, gate.value)) - state.armySize;
    } else {
      score = -gate.value;
    }
    if (score > bestScore) {
      bestScore = score;
      bestLane = gate.lane;
    }
  }
  return bestLane;
}

function materializeSegment(state: GameState, segment: WorldSegment, rng: () => number): void {
  if (segment.materialized) {
    return;
  }
  segment.materialized = true;

  if (segment.kind === 'BossApproach') {
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    const armyFrontZ = armyFrontWorldZ(playerZ, state.formationSlots);
    clearGatesNearWorldZ(state, armyFrontZ + BOSS_CONFIG.spawnDepthOffset, BOSS_CONFIG.gateClearanceZ);
    clearHazardsNearWorldZ(state, armyFrontZ + BOSS_CONFIG.spawnDepthOffset, BOSS_CONFIG.gateClearanceZ);
    return;
  }

  if (segment.kind === 'LaneHazard') {
    spawnHazardSet(state, rng);
    return;
  }

  if (isGateSegmentKind(segment.kind)) {
    spawnGateChoice(state, rng, modeForSegment(segment.kind));
  }

  if (segment.kind === 'EnemyWave' || segment.kind === 'MixedEncounter') {
    const lane = segment.kind === 'MixedEncounter' ? bestRewardLane(state) : undefined;
    const spawned = spawnWaveGroup(state, rng, lane);
    const extra = Math.max(0, waveGroupCount(state.distance) - (spawned > 0 ? 1 : 0));
    segment.waveRemaining = extra;
    segment.waveTimer = spawned > 0 ? scaledSpawnInterval(state.distance) : COMBAT_CONFIG.spawnRetryDelay;
  } else if (isGateFollowupKind(segment.kind)) {
    segment.waveRemaining = 1;
    segment.waveTimer = DIFFICULTY_CONFIG.gateFollowupDelay;
  }
}

function materializeDueSegments(state: GameState, rng: () => number): void {
  if (isBossPresent(state.boss)) {
    return;
  }
  const live = activeSegments(state);
  for (let i = 0; i < live.length; i += 1) {
    const segment = live[i]!;
    if (segment.materialized) {
      continue;
    }
    if (state.distance + DIFFICULTY_CONFIG.materializeLead >= segment.startDistance) {
      materializeSegment(state, segment, rng);
    }
  }
  syncNextGateDistance(state);
}

function tickEnemyWaves(state: GameState, dt: number, rng: () => number): void {
  if (isBossPresent(state.boss)) {
    return;
  }
  const live = activeSegments(state);
  for (let i = 0; i < live.length; i += 1) {
    const segment = live[i]!;
    if (!segment.materialized || segment.waveRemaining <= 0) {
      continue;
    }
    if (!isEnemySegmentKind(segment.kind) && !isGateFollowupKind(segment.kind)) {
      continue;
    }
    if (state.distance > segment.startDistance + segment.length) {
      segment.waveRemaining = 0;
      continue;
    }
    segment.waveTimer -= dt;
    if (segment.waveTimer > 0) {
      continue;
    }
    const lane = segment.kind === 'MixedEncounter' ? bestRewardLane(state) : undefined;
    const spawned = spawnWaveGroup(state, rng, lane);
    if (spawned > 0) {
      segment.waveRemaining -= 1;
      segment.waveTimer = scaledSpawnInterval(state.distance);
    } else {
      segment.waveTimer = COMBAT_CONFIG.spawnRetryDelay;
    }
  }
}

function resumeAfterBoss(state: GameState, rng: () => number): void {
  if (isBossPresent(state.boss) || !state.pendingRecovery) {
    return;
  }
  const start = Math.max(
    state.worldFrontier,
    state.distance + DIFFICULTY_CONFIG.recoveryAfterBossGap,
  );
  if (hasActiveKind(state, 'RecoverySection')) {
    return;
  }
  appendSegment(state, 'RecoverySection', start, rng);
  fillLookahead(state, rng);
  syncNextGateDistance(state);
}

/** After a debug distance jump, drop skipped encounters and rebuild ahead. */
export function resyncWorldAfterDistanceJump(state: GameState, rng?: () => number): void {
  for (let i = 0; i < state.segments.length; i += 1) {
    const segment = state.segments[i];
    if (!segment?.active) {
      continue;
    }
    if (segment.startDistance < state.distance) {
      recycleSegment(segment);
    }
  }
  state.worldFrontier = Math.max(state.worldFrontier, state.distance);
  state.lastSegmentKind = null;
  state.sameKindStreak = 0;
  fillLookahead(state, resolveRng(state, rng));
  syncNextGateDistance(state);
}

export function updateWorld(
  state: GameState,
  dt: number,
  rng?: () => number,
): void {
  if (state.status !== 'running') {
    return;
  }
  const roll = resolveRng(state, rng);
  recyclePassedSegments(state);
  state.worldFrontier = Math.max(state.worldFrontier, state.distance);
  tryScheduleBossFromKills(state);
  resumeAfterBoss(state, roll);
  fillLookahead(state, roll);
  materializeDueSegments(state, roll);
  tickEnemyWaves(state, dt, roll);
}

/** Test helper — forces an encounter at the current distance. */
export function debugQueueSegment(
  state: GameState,
  kind: SegmentKind,
  startDistance = state.distance,
  length = 80,
): WorldSegment | null {
  return pushWorldSegment(state, kind, startDistance, length);
}
