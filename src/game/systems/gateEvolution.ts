import { GATE_CONFIG } from '../config/gates';
import type { Gate } from '../entities/gates';

export interface GateEvolutionResult {
  steps: number;
  crossedZero: boolean;
  crossedPositive: boolean;
}

/** Sync operation/value fields from the evolving signed value. */
export function syncShootableGateDerived(gate: Gate): void {
  if (!gate.shootable) {
    return;
  }
  if (gate.signedValue >= 0) {
    gate.operation = 'add';
    gate.value = gate.signedValue;
    return;
  }
  gate.operation = 'subtract';
  gate.value = Math.abs(gate.signedValue);
}

export function formatSignedGateValue(signedValue: number): string {
  if (signedValue > 0) {
    return `+${signedValue}`;
  }
  if (signedValue < 0) {
    return `${signedValue}`;
  }
  return '0';
}

export function applyHitToShootableGate(gate: Gate, hits = 1): GateEvolutionResult {
  const { shootable: config } = GATE_CONFIG;
  let steps = 0;
  let crossedZero = false;
  let crossedPositive = false;

  if (!gate.shootable || gate.activated || hits <= 0) {
    return { steps, crossedZero, crossedPositive };
  }

  gate.damageBuffer += hits;

  while (gate.damageBuffer >= config.hitsPerStep) {
    gate.damageBuffer -= config.hitsPerStep;
    const previous = gate.signedValue;
    gate.signedValue += 1;
    steps += 1;

    if (previous < 0 && gate.signedValue === 0) {
      crossedZero = true;
    }
    if (previous <= 0 && gate.signedValue > 0) {
      crossedPositive = true;
    }
  }

  if (steps > 0) {
    syncShootableGateDerived(gate);
    gate.valueFlash = config.valueFlashDuration;
  }

  return { steps, crossedZero, crossedPositive };
}

export function shootableGateProgress(gate: Gate): number {
  if (!gate.shootable) {
    return 0;
  }
  return Math.max(0, Math.min(1, gate.damageBuffer / GATE_CONFIG.shootable.hitsPerStep));
}
