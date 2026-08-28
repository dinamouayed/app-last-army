export type GateOperation = 'add' | 'subtract' | 'multiply';

export interface GateOperationPool {
  operation: GateOperation;
  weight: number;
  values: readonly number[];
}

export const GATE_CONFIG = {
  maxGates: 12,
  /** World depth of the gate trigger plane. */
  gateDepth: 0.75,
  /** Half-width of the visible panel in world units (within one lane). */
  gateHalfWidth: 0.42,
  firstGateDistance: 48,
  minGateSpacing: 56,
  maxGateSpacing: 78,
  spawnAhead: 54,
  minSpawnAhead: 38,
  spawnRetryDelay: 0.5,
  activationFeedbackDuration: 0.38,
  fadeOutDuration: 0.28,
  /** Prefer 3-lane choices; occasionally spawn 2. */
  threeLaneChoiceWeight: 0.78,
  operationPools: [
    { operation: 'add', weight: 0.42, values: [5, 8, 10, 12, 15, 20, 25, 30, 40] },
    { operation: 'subtract', weight: 0.33, values: [3, 5, 8, 10, 12, 15] },
    { operation: 'multiply', weight: 0.25, values: [2, 3] },
  ] satisfies GateOperationPool[],
  /** When rebalancing, favor these positive templates. */
  rescueAddValues: [10, 15, 20, 25, 30] as const,
  rescueMultiplyValues: [2] as const,
  /** Chance for a spawned gate to be shootable / evolving. */
  shootableGateWeight: 0.38,
  shootable: {
    initialValues: [-8, -10, -12, -15] as const,
    maxValue: 25,
    /** Projectile impacts required before the signed value steps by +1. */
    hitsPerStep: 5,
    hitRadius: 0.4,
    valueFlashDuration: 0.16,
    zeroCrossPulseDuration: 0.42,
    positiveCrossPulseDuration: 0.42,
  },
  /** Weapon barrel gates — lane choice alongside math gates. */
  weaponGate: {
    /** Chance to replace one lane in a gate group with a weapon barrel. */
    choiceWeight: 0.42,
    hitRadius: 0.44,
    hitFlashDuration: 0.1,
    explodeDuration: 0.62,
    absorbDuration: 0.58,
    unlockPulseDuration: 0.55,
    /** Crossing an unfinished barrel wipes the army below this size. */
    failLethalBelow: 10,
    /** Max army fraction lost at 10+ soldiers (when the barrel was not damaged). */
    failArmyFraction: 1 / 3,
  },
} as const;

export type GateConfig = typeof GATE_CONFIG;
