import { describe, expect, it } from '@jest/globals';

import { refreshFormation } from '../army/armyState';
import { visibleSoldierCount } from '../army/formation';
import { GATE_CONFIG } from '../config/gates';
import { GAME_CONFIG } from '../config/game';
import { createGameState } from '../engine/GameState';
import { createEmptyGate, livingGateCount } from '../entities/gates';
import { playerWorldZ } from '../math/camera';
import { asphaltLaneCenterX } from '../math/roadBounds';
import { laneIndexToX } from '../math/lanes';
import type { Gate } from '../entities/gates';
import { applyGateToArmy, updateGates } from './GateSystem';

function makeGate(
  lane: 0 | 1 | 2,
  operation: Gate['operation'],
  value: number,
  z: number,
  shootable = false,
  signedValue = 0,
): Gate {
  const gate = createEmptyGate();
  gate.id = 1;
  gate.groupId = 1;
  gate.active = true;
  gate.lane = lane;
  gate.x = asphaltLaneCenterX(lane, GAME_CONFIG.camera);
  gate.z = z;
  gate.operation = operation;
  gate.value = value;
  gate.shootable = shootable;
  gate.signedValue = signedValue;
  gate.activated = false;
  gate.fadeT = 0;
  return gate;
}

describe('gate activation', () => {
  it('applies +N once and refreshes the formation', () => {
    const state = createGameState();
    state.armySize = 5;
    refreshFormation(state);
    const gate = makeGate(1, 'add', 10, playerWorldZ(state.distance, GAME_CONFIG.camera) + 4);

    applyGateToArmy(state, gate);

    expect(gate.activated).toBe(true);
    expect(state.armySize).toBe(15);
    expect(state.visibleCount).toBe(visibleSoldierCount(15));
    expect(state.gatePulse).toBeGreaterThan(0);
    expect(state.gatePulsePositive).toBe(true);
  });

  it('applies -N once and can trigger game over', () => {
    const state = createGameState();
    state.armySize = 4;
    refreshFormation(state);
    const gate = makeGate(1, 'subtract', 4, playerWorldZ(state.distance, GAME_CONFIG.camera) + 2);

    applyGateToArmy(state, gate);

    expect(state.armySize).toBe(0);
    expect(state.status).toBe('gameover');
  });

  it('applies ×N once', () => {
    const state = createGameState();
    state.armySize = 6;
    refreshFormation(state);
    const gate = makeGate(1, 'multiply', 2, playerWorldZ(state.distance, GAME_CONFIG.camera) + 2);

    applyGateToArmy(state, gate);

    expect(state.armySize).toBe(12);
    expect(state.visibleCount).toBe(12);
  });

  it('uses the evolved signed value for shootable gates', () => {
    const state = createGameState();
    state.armySize = 10;
    refreshFormation(state);
    const gate = makeGate(
      1,
      'add',
      5,
      playerWorldZ(state.distance, GAME_CONFIG.camera) + 2,
      true,
      5,
    );

    applyGateToArmy(state, gate);

    expect(state.armySize).toBe(15);
  });

  it('activates only the gate in the army lane when crossing', () => {
    const state = createGameState();
    state.armySize = 8;
    state.armyX = laneIndexToX(0, GAME_CONFIG.laneSpacing);
    state.targetLane = 0;
    refreshFormation(state);
    state.distance = GATE_CONFIG.firstGateDistance + 1;
    state.nextGateDistance = GATE_CONFIG.firstGateDistance;

    updateGates(state, 1 / 60, () => 0.12);

    expect(livingGateCount(state.gates)).toBeGreaterThanOrEqual(2);
    const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
    for (const gate of state.gates) {
      if (gate.active) {
        gate.z = playerZ - 0.05;
      }
    }

    updateGates(state, 1 / 60, () => 0.5);

    const activated = state.gates.filter((gate) => gate.activated);
    expect(activated.length).toBe(1);
    expect(activated[0]?.lane).toBe(0);
  });
});
