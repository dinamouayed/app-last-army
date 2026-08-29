import {
  armyDamageMultiplier,
  armyFireRateMultiplier,
  clampWorldXToFireCorridor,
  getArmyFiringOrigins,
} from '../army/firing';
import { getContactEnemyOffsetXs } from '../army/contactFiring';
import { COMBAT_CONFIG } from '../config/combat';
import { GAME_CONFIG } from '../config/game';
import {
  getEffectiveWeapon,
  getWeaponUpgradeTier,
} from '../config/weapons';
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
  vx: number,
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
    vx: 0,
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
  projectile.vx = vx;
  projectile.radius = COMBAT_CONFIG.projectileRadius;
  return projectile;
}

function pelletSpreadOffset(
  pelletIndex: number,
  pelletCount: number,
  spread: number,
  rng: () => number,
): number {
  if (pelletCount <= 1) {
    return spread > 0 ? (rng() * 2 - 1) * spread : 0;
  }
  const t = pelletCount === 1 ? 0 : pelletIndex / (pelletCount - 1);
  return (t * 2 - 1) * spread;
}

export function fireCurrentWeapon(
  state: GameState,
  rng: () => number = Math.random,
): Projectile | null {
  const weapon = getEffectiveWeapon(
    state.weaponId,
    getWeaponUpgradeTier(state.weaponUpgradeTiers, state.weaponId),
  );
  const origins = getArmyFiringOrigins(state.formationSlots, state.armySize, {
    contactOffsetX: getContactEnemyOffsetXs(state),
  });
  const playerZ = playerWorldZ(state.distance, GAME_CONFIG.camera);
  const baseZ = playerZ + COMBAT_CONFIG.muzzleWorldZ;
  const damage = weapon.damage * armyDamageMultiplier(state.armySize);
  let first: Projectile | null = null;

  const start =
    origins.length > 0 ? state.fireOriginIndex % origins.length : 0;

  const multiPellet = weapon.projectileCount > 1;

  if (multiPellet) {
    const origin = origins[start];
    if (origin) {
      const originZ = baseZ + origin.offsetZ * 0.35;
      for (let p = 0; p < weapon.projectileCount; p += 1) {
        const spreadX = pelletSpreadOffset(p, weapon.projectileCount, weapon.spread, rng);
        const originX = clampWorldXToFireCorridor(
          state.armyX + origin.offsetX + COMBAT_CONFIG.muzzleWorldX + spreadX,
          state.armyX,
        );
        const projectile = spawnProjectile(
          state,
          originX,
          originZ,
          damage,
          weapon.projectileSpeed,
          0,
        );
        if (!first && projectile) {
          first = projectile;
        }
      }
    }
    state.fireOriginIndex = (state.fireOriginIndex + 1) % Math.max(1, origins.length);
  } else {
    for (let i = 0; i < origins.length; i += 1) {
      const origin = origins[(start + i) % origins.length];
      if (!origin) {
        continue;
      }
      const spreadX =
        weapon.spread > 0 ? (rng() * 2 - 1) * weapon.spread : 0;
      const originX = clampWorldXToFireCorridor(
        state.armyX + origin.offsetX + COMBAT_CONFIG.muzzleWorldX + spreadX,
        state.armyX,
      );
      const originZ = baseZ + origin.offsetZ * 0.35;
      const projectile = spawnProjectile(
        state,
        originX,
        originZ,
        damage,
        weapon.projectileSpeed,
        0,
      );
      if (!first && projectile) {
        first = projectile;
      }
    }
    state.fireOriginIndex = (state.fireOriginIndex + 1) % Math.max(1, origins.length);
  }

  if (first) {
    state.muzzleFlash = COMBAT_CONFIG.muzzleFlashDuration;
  }
  return first;
}

export function updateShooting(state: GameState, dt: number): void {
  if (state.armySize <= 0) {
    return;
  }

  const weapon = getEffectiveWeapon(
    state.weaponId,
    getWeaponUpgradeTier(state.weaponUpgradeTiers, state.weaponId),
  );
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
