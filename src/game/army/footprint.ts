import { ARMY_CONFIG } from '../config/army';
import { circlesOverlap } from '../math/collision';
import type { FormationSlot } from './formation';
import { visibleSoldierCount, wedgeRowSpacingX, wedgeRowWidth } from './formation';

export interface FootprintSlice {
  x: number;
  z: number;
  radius: number;
}

/** Build a cheap wedge-shaped footprint from formation layout metadata. */
export function buildArmyFootprint(
  armySize: number,
  armyX: number,
  playerZ: number,
): FootprintSlice[] {
  const visible = visibleSoldierCount(armySize);
  if (visible <= 0) {
    return [];
  }

  const slices: FootprintSlice[] = [];
  const { formationSpacingZ, soldierCollisionRadius, formationMaxDepth } = ARMY_CONFIG;
  let placed = 0;
  let depth = 0;

  while (placed < visible && depth < formationMaxDepth) {
    const rowWidth = wedgeRowWidth(depth);
    const soldiersInRow = Math.min(rowWidth, visible - placed);
    const spacingX = wedgeRowSpacingX(depth);
    const halfSpan = ((soldiersInRow - 1) / 2) * spacingX;
    const offsetZ = -depth * formationSpacingZ;
    const rowRadius = halfSpan + soldierCollisionRadius;

    slices.push({
      x: armyX,
      z: playerZ + offsetZ,
      radius: rowRadius,
    });

    placed += soldiersInRow;
    depth += 1;
  }

  return slices;
}

export function buildFootprintFromSlots(
  armyX: number,
  playerZ: number,
  slots: FormationSlot[],
): FootprintSlice[] {
  const slices: FootprintSlice[] = [];
  const rowMap = new Map<number, { minX: number; maxX: number; z: number }>();

  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (!slot?.active) {
      continue;
    }
    const key = Math.round(slot.depth * 100);
    const worldX = armyX + slot.offsetX;
    const worldZ = playerZ + slot.offsetZ;
    const existing = rowMap.get(key);
    if (!existing) {
      rowMap.set(key, { minX: worldX, maxX: worldX, z: worldZ });
    } else {
      existing.minX = Math.min(existing.minX, worldX);
      existing.maxX = Math.max(existing.maxX, worldX);
    }
  }

  for (const row of rowMap.values()) {
    const halfSpan = (row.maxX - row.minX) * 0.5;
    slices.push({
      x: (row.minX + row.maxX) * 0.5,
      z: row.z,
      radius: halfSpan + ARMY_CONFIG.soldierCollisionRadius,
    });
  }

  return slices;
}

export function enemyOverlapsArmyFootprint(
  enemyX: number,
  enemyZ: number,
  enemyRadius: number,
  slices: FootprintSlice[],
): boolean {
  for (let i = 0; i < slices.length; i += 1) {
    const slice = slices[i];
    if (!slice) {
      continue;
    }
    if (circlesOverlap(enemyX, enemyZ, enemyRadius, slice.x, slice.z, slice.radius)) {
      return true;
    }
  }
  return false;
}

export function nearestFootprintDistance(
  enemyX: number,
  enemyZ: number,
  slices: FootprintSlice[],
): number {
  let best = Infinity;
  for (let i = 0; i < slices.length; i += 1) {
    const slice = slices[i];
    if (!slice) {
      continue;
    }
    const dx = enemyX - slice.x;
    const dz = enemyZ - slice.z;
    const dist = Math.sqrt(dx * dx + dz * dz) - slice.radius;
    best = Math.min(best, dist);
  }
  return best;
}

/** Closest point on the army footprint boundary for steering / contact. */
export function closestPointOnArmyFootprint(
  enemyX: number,
  enemyZ: number,
  slices: FootprintSlice[],
): { x: number; z: number } {
  let bestX = enemyX;
  let bestZ = enemyZ;
  let bestDistSq = Infinity;

  for (let i = 0; i < slices.length; i += 1) {
    const slice = slices[i];
    if (!slice) {
      continue;
    }
    const dx = enemyX - slice.x;
    const dz = enemyZ - slice.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    let bx: number;
    let bz: number;
    if (dist < slice.radius) {
      if (dist < 0.0001) {
        bx = slice.x;
        bz = slice.z + slice.radius;
      } else {
        bx = slice.x + (dx / dist) * slice.radius;
        bz = slice.z + (dz / dist) * slice.radius;
      }
    } else if (dist < 0.0001) {
      bx = slice.x;
      bz = slice.z + slice.radius;
    } else {
      bx = slice.x + (dx / dist) * slice.radius;
      bz = slice.z + (dz / dist) * slice.radius;
    }
    const d2 = (enemyX - bx) ** 2 + (enemyZ - bz) ** 2;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      bestX = bx;
      bestZ = bz;
    }
  }

  return { x: bestX, z: bestZ };
}

export function nearestFootprintTarget(
  enemyX: number,
  enemyZ: number,
  slices: FootprintSlice[],
): { x: number; z: number } {
  return closestPointOnArmyFootprint(enemyX, enemyZ, slices);
}

/** Place enemy at contact boundary — prevents pass-through integration. */
export function snapEnemyToArmyContact(
  enemyX: number,
  enemyZ: number,
  enemyRadius: number,
  slices: FootprintSlice[],
): { x: number; z: number } {
  const boundary = closestPointOnArmyFootprint(enemyX, enemyZ, slices);
  const dx = enemyX - boundary.x;
  const dz = enemyZ - boundary.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  return {
    x: boundary.x + (dx / len) * enemyRadius * 0.92,
    z: boundary.z + (dz / len) * enemyRadius * 0.92,
  };
}

export function enemyWouldEnterFootprint(
  enemyX: number,
  enemyZ: number,
  nextZ: number,
  enemyRadius: number,
  slices: FootprintSlice[],
): boolean {
  if (enemyOverlapsArmyFootprint(enemyX, enemyZ, enemyRadius, slices)) {
    return true;
  }
  return enemyOverlapsArmyFootprint(enemyX, nextZ, enemyRadius, slices);
}

/** Highest world Z of the army (wedge tip toward the horizon). */
export function armyFrontWorldZ(playerZ: number, slots: FormationSlot[]): number {
  let front = playerZ;
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (!slot?.active) {
      continue;
    }
    front = Math.max(front, playerZ + slot.offsetZ);
  }
  return front;
}
