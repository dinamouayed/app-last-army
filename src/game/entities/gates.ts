import type { GateOperation } from '../config/gates';
import type { LaneIndex } from '../types';

export interface Gate {
  id: number;
  groupId: number;
  active: boolean;
  lane: LaneIndex;
  x: number;
  z: number;
  operation: GateOperation;
  value: number;
  /** Shootable gates evolve via signedValue instead of fixed operations. */
  shootable: boolean;
  signedValue: number;
  damageBuffer: number;
  valueFlash: number;
  evolvePulse: number;
  evolvePulseKind: 'none' | 'zero' | 'positive';
  /** True once the army has crossed and the operation was applied. */
  activated: boolean;
  /** Post-activation fade timer. */
  fadeT: number;
}

export interface GateRuntimeState {
  gates: Gate[];
  nextGateDistance: number;
  nextGroupId: number;
  gatePulse: number;
  gatePulseX: number;
  gatePulseZ: number;
  gatePulsePositive: boolean;
}

export function createGateRuntimeState(): GateRuntimeState {
  return {
    gates: [],
    nextGateDistance: 0,
    nextGroupId: 1,
    gatePulse: 0,
    gatePulseX: 0,
    gatePulseZ: 0,
    gatePulsePositive: true,
  };
}

export function createEmptyGate(): Gate {
  return {
    id: 0,
    groupId: 0,
    active: false,
    lane: 1,
    x: 0,
    z: 0,
    operation: 'add',
    value: 0,
    shootable: false,
    signedValue: 0,
    damageBuffer: 0,
    valueFlash: 0,
    evolvePulse: 0,
    evolvePulseKind: 'none',
    activated: false,
    fadeT: 0,
  };
}

export function livingGateCount(gates: Gate[]): number {
  let count = 0;
  for (let i = 0; i < gates.length; i += 1) {
    const gate = gates[i];
    if (gate?.active) {
      count += 1;
    }
  }
  return count;
}

export function formatGateLabel(gate: Gate): string {
  if (gate.shootable) {
    if (gate.signedValue > 0) {
      return `+${gate.signedValue}`;
    }
    if (gate.signedValue < 0) {
      return `${gate.signedValue}`;
    }
    return '0';
  }
  if (gate.operation === 'add') {
    return `+${gate.value}`;
  }
  if (gate.operation === 'subtract') {
    return `-${gate.value}`;
  }
  return `×${gate.value}`;
}

export function isPositiveGate(gate: Gate): boolean {
  if (gate.shootable) {
    return gate.signedValue >= 0;
  }
  return gate.operation === 'add' || gate.operation === 'multiply';
}

export function isNegativeGate(gate: Gate): boolean {
  if (gate.shootable) {
    return gate.signedValue < 0;
  }
  return gate.operation === 'subtract';
}
