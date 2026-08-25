import { describe, expect, it } from '@jest/globals';

import { GATE_CONFIG } from '../config/gates';
import { createEmptyGate } from '../entities/gates';
import {
  applyHitToShootableGate,
  formatSignedGateValue,
  shootableGateProgress,
  syncShootableGateDerived,
} from './gateEvolution';

describe('gateEvolution', () => {
  it('formats signed values for display', () => {
    expect(formatSignedGateValue(-10)).toBe('-10');
    expect(formatSignedGateValue(0)).toBe('0');
    expect(formatSignedGateValue(12)).toBe('+12');
  });

  it('steps from -10 toward positive values as hits accumulate', () => {
    const gate = createEmptyGate();
    gate.shootable = true;
    gate.signedValue = -10;
    syncShootableGateDerived(gate);

    for (let i = 0; i < GATE_CONFIG.shootable.hitsPerStep - 1; i += 1) {
      const pending = applyHitToShootableGate(gate, 1);
      expect(pending.steps).toBe(0);
      expect(gate.signedValue).toBe(-10);
    }

    const first = applyHitToShootableGate(gate, 1);
    expect(first.steps).toBe(1);
    expect(gate.signedValue).toBe(-9);
    expect(gate.operation).toBe('subtract');
    expect(gate.value).toBe(9);

    for (let i = 0; i < 8 * GATE_CONFIG.shootable.hitsPerStep; i += 1) {
      applyHitToShootableGate(gate, 1);
    }
    expect(gate.signedValue).toBe(-1);

    for (let i = 0; i < GATE_CONFIG.shootable.hitsPerStep - 1; i += 1) {
      applyHitToShootableGate(gate, 1);
    }
    const toZero = applyHitToShootableGate(gate, 1);
    expect(toZero.crossedZero).toBe(true);
    expect(gate.signedValue).toBe(0);
    expect(gate.operation).toBe('add');
    expect(gate.value).toBe(0);

    for (let i = 0; i < GATE_CONFIG.shootable.hitsPerStep - 1; i += 1) {
      applyHitToShootableGate(gate, 1);
    }
    const toPositive = applyHitToShootableGate(gate, 1);
    expect(toPositive.crossedPositive).toBe(true);
    expect(gate.signedValue).toBe(1);
    expect(gate.operation).toBe('add');
    expect(gate.value).toBe(1);
  });

  it('caps evolution at the configured maximum', () => {
    const gate = createEmptyGate();
    gate.shootable = true;
    gate.signedValue = GATE_CONFIG.shootable.maxValue - 1;
    syncShootableGateDerived(gate);

    for (let i = 0; i < GATE_CONFIG.shootable.hitsPerStep; i += 1) {
      applyHitToShootableGate(gate, 1);
    }
    expect(gate.signedValue).toBe(GATE_CONFIG.shootable.maxValue);

    const capped = applyHitToShootableGate(gate, GATE_CONFIG.shootable.hitsPerStep);
    expect(capped.steps).toBe(0);
    expect(gate.signedValue).toBe(GATE_CONFIG.shootable.maxValue);
  });

  it('tracks progress toward the next step', () => {
    const gate = createEmptyGate();
    gate.shootable = true;
    gate.signedValue = -4;
    gate.damageBuffer = GATE_CONFIG.shootable.hitsPerStep * 0.5;
    expect(shootableGateProgress(gate)).toBeCloseTo(0.5, 5);
  });
});
