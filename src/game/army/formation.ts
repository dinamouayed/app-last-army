import { ARMY_CONFIG } from '../config/army';
import { GAME_CONFIG } from '../config/game';
import { hash01, hashRange } from '../math/hash';

export interface FormationSlot {
  active: boolean;
  offsetX: number;
  offsetZ: number;
  depth: number;
  variation: number;
  phase: number;
  dying: boolean;
  deathT: number;
}

export interface DyingSoldierVisual {
  active: boolean;
  offsetX: number;
  offsetZ: number;
  phase: number;
  t: number;
}

export function createDyingVisualPool(
  size = ARMY_CONFIG.maxVisibleSoldiers,
): DyingSoldierVisual[] {
  return Array.from({ length: size }, () => ({
    active: false,
    offsetX: 0,
    offsetZ: 0,
    phase: 0,
    t: 0,
  }));
}

export function createEmptyFormationSlot(): FormationSlot {
  return {
    active: false,
    offsetX: 0,
    offsetZ: 0,
    depth: 0,
    variation: 0,
    phase: 0,
    dying: false,
    deathT: 0,
  };
}

export function createFormationBuffer(): FormationSlot[] {
  return Array.from({ length: ARMY_CONFIG.maxVisibleSoldiers }, createEmptyFormationSlot);
}

/** Maps logical army size to the number of visible soldier slots. */
export function visibleSoldierCount(armySize: number): number {
  if (armySize <= 0) {
    return 0;
  }
  const max = ARMY_CONFIG.maxVisibleSoldiers;
  if (armySize <= max) {
    return armySize;
  }
  return max;
}

/** Width of a wedge row at a given depth (1 at tip, grows toward rear). */
export function wedgeRowWidth(depth: number): number {
  const growthSteps = Math.floor(depth / ARMY_CONFIG.widthGrowEveryDepth);
  const width = ARMY_CONFIG.formationFrontWidth + growthSteps * 2;
  return Math.min(width, ARMY_CONFIG.formationRearMaxWidth);
}

/** Horizontal spacing for a wedge row — rear rows spread wider. */
export function wedgeRowSpacingX(depth: number): number {
  return ARMY_CONFIG.formationSpacingX * (1 + depth * ARMY_CONFIG.rearSpacingXScale);
}

/** Backward offset of a row. Large depths reach past the bottom of the screen. */
export function wedgeRowOffsetZ(depth: number): number {
  const stretched =
    -depth * ARMY_CONFIG.formationSpacingZ * (1 + depth * ARMY_CONFIG.rearSpacingZScale);
  const limit = -(GAME_CONFIG.camera.playerDepth - GAME_CONFIG.camera.zClip - 0.45);
  return Math.max(stretched, limit);
}

/**
 * Forward-pointing wedge: tip at offsetZ ≈ 0 (toward horizon),
 * rear expands backward (negative offsetZ → bottom of screen).
 */
export function buildFormationSlots(
  visibleCount: number,
  slots: FormationSlot[],
): void {
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (!slot) {
      continue;
    }
    slot.active = false;
    slot.dying = false;
    slot.deathT = 0;
  }

  const cappedCount = Math.min(visibleCount, slots.length);
  if (cappedCount <= 0) {
    return;
  }

  let placed = 0;
  let depth = 0;
  const { formationMaxDepth } = ARMY_CONFIG;

  while (placed < cappedCount && depth < formationMaxDepth) {
    const rowWidth = wedgeRowWidth(depth);
    const soldiersInRow = Math.min(rowWidth, cappedCount - placed);
    const spacingX = wedgeRowSpacingX(depth);
    const startCol = -(soldiersInRow - 1) / 2;
    const offsetZ = wedgeRowOffsetZ(depth);

    for (let col = 0; col < soldiersInRow; col += 1) {
      const slot = slots[placed];
      if (!slot) {
        return;
      }

      const index = placed;
      const baseX = (startCol + col) * spacingX;

      slot.active = true;
      slot.offsetX = baseX + hashRange(index, -0.035, 0.035);
      slot.offsetZ = offsetZ + hashRange(index + 37, -0.025, 0.025);
      slot.depth = depth;
      slot.variation = hash01(index + 71);
      slot.phase = hashRange(index + 113, 0, Math.PI * 2);
      slot.dying = false;
      slot.deathT = 0;

      placed += 1;
      if (placed >= cappedCount) {
        return;
      }
    }

    depth += 1;
  }
}

/** Tip / front rows first (highest offsetZ = toward horizon). */
export function sortedSlotIndices(slots: FormationSlot[]): number[] {
  const indices: number[] = [];
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (slot?.active && !slot.dying) {
      indices.push(i);
    }
  }
  indices.sort((a, b) => {
    const slotA = slots[a];
    const slotB = slots[b];
    if (!slotA || !slotB) {
      return 0;
    }
    if (slotA.offsetZ !== slotB.offsetZ) {
      return slotB.offsetZ - slotA.offsetZ;
    }
    return Math.abs(slotA.offsetX) - Math.abs(slotB.offsetX);
  });
  return indices;
}

export function formationFrontWidth(slots: FormationSlot[]): number {
  let maxZ = -Infinity;
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (slot?.active) {
      maxZ = Math.max(maxZ, slot.offsetZ);
    }
  }
  if (!Number.isFinite(maxZ)) {
    return 0;
  }

  let frontHalfWidth = 0;
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (!slot?.active) {
      continue;
    }
    if (slot.offsetZ >= maxZ - 0.08) {
      frontHalfWidth = Math.max(frontHalfWidth, Math.abs(slot.offsetX));
    }
  }
  return frontHalfWidth * 2 + ARMY_CONFIG.soldierCollisionRadius;
}

export function formationCenterOffset(slots: FormationSlot[]): { x: number; z: number } {
  let sumX = 0;
  let sumZ = 0;
  let count = 0;
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (!slot?.active) {
      continue;
    }
    sumX += slot.offsetX;
    sumZ += slot.offsetZ;
    count += 1;
  }
  if (count === 0) {
    return { x: 0, z: 0 };
  }
  return { x: sumX / count, z: sumZ / count };
}

export function maxFormationExtent(slots: FormationSlot[]): number {
  let max = 0;
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (!slot?.active) {
      continue;
    }
    max = Math.max(max, Math.abs(slot.offsetX), Math.abs(slot.offsetZ));
  }
  return max;
}

/** Slight fire-rate boost for larger armies without unbounded projectiles. */
export function armyFireRateMultiplier(armySize: number): number {
  if (armySize <= 1) {
    return 1;
  }
  return Math.min(1.45, 1 + Math.log10(armySize) * 0.18);
}
