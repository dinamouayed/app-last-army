import { ARMY_CONFIG } from '../config/army';
import type { FormationSlot } from './formation';
import { armyFireRateMultiplier, sortedSlotIndices } from './formation';

export interface FiringOrigin {
  offsetX: number;
  offsetZ: number;
}

export interface FiringOriginOptions {
  contactOffsetX?: number[];
}

export function clampToFireCorridor(offsetX: number, halfWidth: number = ARMY_CONFIG.fireCorridorHalfWidth): number {
  return Math.max(-halfWidth, Math.min(halfWidth, offsetX));
}

/** World X snapped to the offensive corridor of the army's selected lane. */
export function clampWorldXToFireCorridor(
  worldX: number,
  armyX: number,
  halfWidth: number = ARMY_CONFIG.fireCorridorHalfWidth,
): number {
  return armyX + clampToFireCorridor(worldX - armyX, halfWidth);
}

/** Bounded count of projectile spawns per volley — clustered, not road-wide. */
export function firingOriginCount(armySize: number): number {
  if (armySize <= 1) {
    return 1;
  }
  if (armySize <= 12) {
    return Math.min(2, armySize);
  }
  if (armySize <= 60) {
    return Math.min(4, Math.ceil(armySize / 15));
  }
  return ARMY_CONFIG.maxFiringOrigins;
}

/** Logical damage multiplier — scales power without widening the corridor. */
export function armyDamageMultiplier(armySize: number): number {
  if (armySize <= 1) {
    return 1;
  }
  return Math.min(
    ARMY_CONFIG.armyDamageScaleMax,
    1 + Math.log10(armySize) * 0.32,
  );
}

export { armyFireRateMultiplier };

/**
 * Select firing origins from the front wedge only, inside the lane corridor.
 * Rear visual soldiers never become projectile origins.
 */
export function getArmyFiringOrigins(
  formationSlots: FormationSlot[],
  armySize: number,
  options: FiringOriginOptions = {},
): FiringOrigin[] {
  const contactOffsets = options.contactOffsetX ?? [];
  const corridorHalf = ARMY_CONFIG.fireCorridorHalfWidth;
  const count = Math.min(firingOriginCount(armySize), ARMY_CONFIG.maxFiringOrigins);
  const frontIndices = sortedSlotIndices(formationSlots);
  const maxDepth = ARMY_CONFIG.maxFiringFormationDepth;

  const candidates: FiringOrigin[] = [];
  for (let i = 0; i < frontIndices.length; i += 1) {
    const index = frontIndices[i];
    if (index === undefined) {
      continue;
    }
    const slot = formationSlots[index];
    if (!slot?.active || slot.dying || slot.depth > maxDepth) {
      continue;
    }
    if (Math.abs(slot.offsetX) > corridorHalf) {
      continue;
    }
    candidates.push({
      offsetX: clampToFireCorridor(slot.offsetX, corridorHalf),
      offsetZ: slot.offsetZ,
    });
  }

  if (candidates.length === 0) {
    candidates.push({ offsetX: 0, offsetZ: 0 });
  }

  candidates.sort(
    (a, b) =>
      Math.abs(a.offsetX) - Math.abs(b.offsetX) ||
      b.offsetZ - a.offsetZ,
  );

  const picked: FiringOrigin[] = [];
  for (let i = 0; i < count; i += 1) {
    const source = candidates[i % candidates.length];
    if (!source) {
      break;
    }
    const spread = ARMY_CONFIG.fireOriginClusterSpread;
    const jitter = ((i % 3) - 1) * spread * 0.35;
    picked.push({
      offsetX: clampToFireCorridor(source.offsetX + jitter, corridorHalf),
      offsetZ: source.offsetZ,
    });
  }

  for (let i = 0; i < contactOffsets.length; i += 1) {
    const offsetX = contactOffsets[i];
    if (offsetX === undefined) {
      continue;
    }
    picked.push({
      offsetX: clampToFireCorridor(offsetX, corridorHalf),
      offsetZ: 0,
    });
  }

  return picked;
}

/** All firing world X positions must stay inside the corridor around armyX. */
export function firingCorridorContains(
  worldX: number,
  armyX: number,
  halfWidth: number = ARMY_CONFIG.fireCorridorHalfWidth,
): boolean {
  return Math.abs(worldX - armyX) <= halfWidth + 0.001;
}
