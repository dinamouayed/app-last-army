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

export function formatGateLabel(operation: GateOperation, value: number): string {
  if (operation === 'add') {
    return `+${value}`;
  }
  if (operation === 'subtract') {
    return `-${value}`;
  }
  return `×${value}`;
}

export function isPositiveGate(operation: GateOperation): boolean {
  return operation === 'add' || operation === 'multiply';
}
