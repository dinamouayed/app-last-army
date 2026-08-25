import { GATE_CONFIG, type GateOperation } from '../config/gates';
import { scaledUnlockCost } from '../config/weaponUnlocks';
import {
  isRepeatWeaponUnlock,
  pickWeaponForBarrelGate,
  type WeaponId,
} from '../config/weapons';
import type { LaneIndex } from '../types';

export interface GateChoiceDraft {
  lane: LaneIndex;
  kind: 'math' | 'weapon';
  operation?: GateOperation;
  value?: number;
  shootable?: boolean;
  signedValue?: number;
  weaponId?: WeaponId;
  weaponHp?: number;
}

function pickWeightedOperation(rng: () => number): GateOperation {
  const pools = GATE_CONFIG.operationPools;
  let total = 0;
  for (let i = 0; i < pools.length; i += 1) {
    total += pools[i]!.weight;
  }
  let roll = rng() * total;
  for (let i = 0; i < pools.length; i += 1) {
    const pool = pools[i]!;
    roll -= pool.weight;
    if (roll <= 0) {
      return pool.operation;
    }
  }
  return pools[pools.length - 1]!.operation;
}

function valuesForOperation(operation: GateOperation): readonly number[] {
  for (let i = 0; i < GATE_CONFIG.operationPools.length; i += 1) {
    const pool = GATE_CONFIG.operationPools[i];
    if (pool?.operation === operation) {
      return pool.values;
    }
  }
  return GATE_CONFIG.operationPools[0]!.values;
}

function pickValue(operation: GateOperation, rng: () => number): number {
  const values = valuesForOperation(operation);
  const index = Math.floor(rng() * values.length);
  return values[Math.min(index, values.length - 1)] ?? values[0] ?? 1;
}

export function applyGateArithmetic(
  armySize: number,
  operation: GateOperation,
  value: number,
): number {
  if (operation === 'add') {
    return armySize + value;
  }
  if (operation === 'subtract') {
    return Math.max(0, armySize - value);
  }
  return Math.max(0, Math.floor(armySize * value));
}

function pickLanes(count: 2 | 3, rng: () => number): LaneIndex[] {
  if (count === 3) {
    return [0, 1, 2];
  }
  const skip = Math.floor(rng() * 3) as LaneIndex;
  const lanes: LaneIndex[] = [];
  for (let lane = 0; lane < 3; lane += 1) {
    if (lane !== skip) {
      lanes.push(lane as LaneIndex);
    }
  }
  return lanes;
}

function pickShootableInitialValue(rng: () => number): number {
  const values = GATE_CONFIG.shootable.initialValues;
  const index = Math.floor(rng() * values.length);
  return values[Math.min(index, values.length - 1)] ?? -10;
}

function maybeMakeShootable(choice: GateChoiceDraft, rng: () => number): GateChoiceDraft {
  if (choice.kind === 'weapon' || choice.operation === 'multiply' || rng() >= GATE_CONFIG.shootableGateWeight) {
    return choice;
  }
  const signedValue = pickShootableInitialValue(rng);
  return {
    lane: choice.lane,
    kind: 'math',
    shootable: true,
    signedValue,
    operation: 'subtract',
    value: Math.abs(signedValue),
  };
}

function draftMathChoice(lane: LaneIndex, rng: () => number): GateChoiceDraft {
  const operation = pickWeightedOperation(rng);
  const choice: GateChoiceDraft = {
    lane,
    kind: 'math',
    operation,
    value: pickValue(operation, rng),
  };
  return maybeMakeShootable(choice, rng);
}

function draftWeaponChoice(
  lane: LaneIndex,
  weaponId: WeaponId,
  distance: number,
  unlocked: readonly WeaponId[],
): GateChoiceDraft {
  let cost = scaledUnlockCost(
    weaponId as Exclude<WeaponId, 'pistol'>,
    distance,
  );
  if (isRepeatWeaponUnlock(unlocked, weaponId)) {
    cost = Math.floor(cost * 1.35);
  }
  return {
    lane,
    kind: 'weapon',
    weaponId,
    weaponHp: cost,
  };
}

function isSurvivableSet(choices: GateChoiceDraft[], armySize: number): boolean {
  for (let i = 0; i < choices.length; i += 1) {
    const choice = choices[i];
    if (!choice) {
      continue;
    }
    if (choice.kind === 'weapon' || choice.shootable) {
      return true;
    }
    if (applyGateArithmetic(armySize, choice.operation!, choice.value!) > 0) {
      return true;
    }
  }
  return false;
}

function isObviouslyUnfair(choices: GateChoiceDraft[], armySize: number): boolean {
  const mathChoices = choices.filter((c) => c.kind === 'math' && !c.shootable);
  if (mathChoices.length === 0) {
    return false;
  }
  const results = mathChoices.map((choice) =>
    applyGateArithmetic(armySize, choice.operation!, choice.value!),
  );
  if (results.every((result) => result <= 0) && !choices.some((c) => c.kind === 'weapon' || c.shootable)) {
    return true;
  }

  const sorted = [...results].sort((a, b) => b - a);
  const best = sorted[0] ?? 0;
  const second = sorted[1] ?? best;
  if (mathChoices.length >= 2 && best > 0 && second > 0 && best >= second * 2.35 && best >= armySize + 8) {
    return true;
  }
  return false;
}

function rescueChoice(lane: LaneIndex, armySize: number, rng: () => number): GateChoiceDraft {
  if (armySize <= 4 || rng() < 0.55) {
    const values = GATE_CONFIG.rescueAddValues;
    const value = values[Math.floor(rng() * values.length)] ?? 10;
    return { lane, kind: 'math', operation: 'add', value };
  }
  const values = GATE_CONFIG.rescueMultiplyValues;
  const value = values[Math.floor(rng() * values.length)] ?? 2;
  return { lane, kind: 'math', operation: 'multiply', value };
}

function rebalanceChoices(
  choices: GateChoiceDraft[],
  armySize: number,
  rng: () => number,
): GateChoiceDraft[] {
  const next = choices.map((choice) => ({ ...choice }));
  const rescueIndex = next.findIndex((c) => c.kind === 'math');
  const index = rescueIndex >= 0 ? rescueIndex : 0;
  next[index] = rescueChoice(next[index]!.lane, armySize, rng);

  if (!isSurvivableSet(next, armySize)) {
    for (let i = 0; i < next.length; i += 1) {
      if (next[i]!.kind === 'weapon') {
        continue;
      }
      next[i] = rescueChoice(next[i]!.lane, armySize, rng);
    }
  }
  return next;
}

function softenDominantChoice(
  choices: GateChoiceDraft[],
  armySize: number,
  rng: () => number,
): GateChoiceDraft[] {
  const mathOnly = choices
    .map((choice, index) => ({ choice, index }))
    .filter((item) => item.choice.kind === 'math' && !item.choice.shootable);
  const scored = mathOnly.map(({ choice, index }) => ({
    index,
    choice,
    result: applyGateArithmetic(armySize, choice.operation!, choice.value!),
  }));
  scored.sort((a, b) => b.result - a.result);
  const top = scored[0];
  const runnerUp = scored[1];
  if (!top || !runnerUp) {
    return choices;
  }
  if (top.result < runnerUp.result * 2.35) {
    return choices;
  }

  const next = choices.map((choice) => ({ ...choice }));
  const replacement = draftMathChoice(top.choice.lane, rng);
  next[top.index] = replacement;
  if (!isSurvivableSet(next, armySize) || isObviouslyUnfair(next, armySize)) {
    next[top.index] = {
      lane: top.choice.lane,
      kind: 'math',
      operation: 'add',
      value: pickValue('add', rng),
    };
  }
  return next;
}

function maybeInjectWeaponGate(
  choices: GateChoiceDraft[],
  unlocked: readonly WeaponId[],
  distance: number,
  rng: () => number,
): GateChoiceDraft[] {
  if (rng() >= GATE_CONFIG.weaponGate.choiceWeight) {
    return choices;
  }

  const weaponId = pickWeaponForBarrelGate(unlocked, rng);
  const next = choices.map((choice) => ({ ...choice }));
  const replaceIndex = Math.floor(rng() * next.length);
  next[replaceIndex] = draftWeaponChoice(next[replaceIndex]!.lane, weaponId, distance, unlocked);

  if (!isSurvivableSet(next, 1)) {
    return choices;
  }
  return next;
}

/** Build 2–3 lane gate choices that are survivable and not obviously unfair. */
export function generateGateChoices(
  armySize: number,
  unlockedWeapons: readonly WeaponId[],
  distance: number,
  rng: () => number = Math.random,
): GateChoiceDraft[] {
  const laneCount: 2 | 3 = rng() < GATE_CONFIG.threeLaneChoiceWeight ? 3 : 2;
  const lanes = pickLanes(laneCount, rng);
  let choices = lanes.map((lane) => draftMathChoice(lane, rng));

  choices = maybeInjectWeaponGate(choices, unlockedWeapons, distance, rng);

  if (!isSurvivableSet(choices, armySize)) {
    choices = rebalanceChoices(choices, armySize, rng);
  }
  if (isObviouslyUnfair(choices, armySize)) {
    choices = softenDominantChoice(choices, armySize, rng);
  }
  if (!isSurvivableSet(choices, armySize)) {
    choices = rebalanceChoices(choices, armySize, rng);
  }
  return choices;
}
