import {
  armyDamageMultiplier,
  armyFireRateMultiplier,
  getArmyFiringOrigins,
} from '../army/firing';
import { getContactEnemyOffsetXs } from '../army/contactFiring';
import { COMBAT_CONFIG } from '../config/combat';
import { GAME_CONFIG } from '../config/game';
import { getWeapon } from '../config/weapons';
import { acquireEntity } from '../entities/combat';
import type { Projectile } from '../entities/combat';
import { playerWorldZ } from '../math/camera';
import type { GameState } from '../types';

function nextId(state: GameState): number {
  const id = state.nextEntityId;
  state.nextEntityId += 1;
  return id;
}

function spawnProjectile(
  state: GameState,
  originX: number,
  originZ: number,
  damage: number,
  speed: number,
): Projectile | null {
  const projectile = acquireEntity(state.projectiles, COMBAT_CONFIG.maxProjectiles, () => ({
    id: 0,
    active: false,
    x: 0,
    z: 0,
    prevX: 0,
    prevZ: 0,
    damage: 0,
    speed: 0,
    radius: COMBAT_CONFIG.projectileRadius,
  }));
  if (!projectile) {
    return null;
  }

  projectile.id = nextId(state);
  projectile.active = true;
  projectile.x = originX;
  projectile.z = originZ;
  projectile.prevX = originX;
  projectile.prevZ = originZ;
  projectile.damage = damage;
  projectile.speed = speed;
  projectile.radius = COMBAT_CONFIG.projectileRadius;
  return projectile;
}

export function fireCurrentWeapon(state: GameState): Projectile | null {
  const weapon = getWeapon(state.weaponId);
  const origins = getArmyFiringOrigins(state.formationSlots, state.armySize, {
    contactOffsetX: getContactEnemyOffsetXs(state),
  });
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const baseZ = playerZ + COMBAT_CONFIG.muzzleWorldZ;
  const damage = weapon.damage * armyDamageMultiplier(state.armySize);
  let first: Projectile | null = null;

  const start =
    origins.length > 0 ? state.fireOriginIndex % origins.length : 0;

  for (let i = 0; i < origins.length; i += 1) {
    const origin = origins[(start + i) % origins.length];
    if (!origin) {
      continue;
    }
    const originX = state.armyX + origin.offsetX + COMBAT_CONFIG.muzzleWorldX;
    const originZ = baseZ + origin.offsetZ * 0.35;
    const projectile = spawnProjectile(
      state,
      originX,
      originZ,
      damage,
      weapon.projectileSpeed,
    );
    if (!first && projectile) {
      first = projectile;
    }
  }

  state.fireOriginIndex = (state.fireOriginIndex + 1) % Math.max(1, origins.length);
  if (first) {
    state.muzzleFlash = COMBAT_CONFIG.muzzleFlashDuration;
  }
  return first;
}

export function updateShooting(state: GameState, dt: number): void {
  if (state.armySize <= 0) {
    return;
  }

  const weapon = getWeapon(state.weaponId);
  const interval = 1 / (weapon.fireRate * armyFireRateMultiplier(state.armySize));
  state.fireAccumulator += dt;
  while (state.fireAccumulator >= interval) {
    state.fireAccumulator -= interval;
    fireCurrentWeapon(state);
  }

  if (state.muzzleFlash > 0) {
    state.muzzleFlash = Math.max(0, state.muzzleFlash - dt);
  }
}
