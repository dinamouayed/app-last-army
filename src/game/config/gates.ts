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
  minGateSpacing: 72,
  maxGateSpacing: 118,
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
} as const;

export type GateConfig = typeof GATE_CONFIG;
