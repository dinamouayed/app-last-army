import type { SkCanvas } from '@shopify/react-native-skia';

import { COMBAT_CONFIG } from '../game/config/combat';
import { enemyDrawScaleMul, enemyPerspectiveScale } from '../game/config/enemies';
import { GAME_CONFIG } from '../game/config/game';
import { worldToScreen } from '../game/math/camera';
import type { Enemy } from '../game/entities/combat';
import type { GameState } from '../game/types';
import type { RenderResources } from './paints';
import { drawSoldierAt, muzzleScreenLift } from './SoldierRenderer';

function drawHpBar(
  canvas: SkCanvas,
  resources: RenderResources,
  enemy: Enemy,
  screenX: number,
  screenY: number,
  scale: number,
): void {
  const width = 24 * scale;
  const height = 3.4 * scale;
  const x = screenX - width * 0.5;
  const y = screenY - muzzleScreenLift(scale) - 14 * scale;
  const ratio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
  canvas.drawRect({ x, y, width, height }, resources.paints.hpBack);
  resources.paints.hpFill.setAlphaf(0.92);
  canvas.drawRect(
    { x: x + 0.6 * scale, y: y + 0.5 * scale, width: (width - 1.2 * scale) * ratio, height: height - 1 * scale },
    resources.paints.hpFill,
  );
  resources.paints.hpFill.setAlphaf(1);
}

function drawOneEnemy(
  canvas: SkCanvas,
  resources: RenderResources,
  enemy: Enemy,
  state: GameState,
  width: number,
  height: number,
): void {
  const death = enemy.dying ? Math.min(1, enemy.deathT / COMBAT_CONFIG.deathDuration) : 0;
  const point = worldToScreen(
    enemy.x,
    enemy.z,
    state.distance,
    width,
    height,
    GAME_CONFIG.camera,
  );
  const scaleMul = 1 - death * 0.55;
  canvas.save();
  canvas.translate(point.screenX, point.screenY);
  canvas.scale(scaleMul, scaleMul);
  canvas.translate(-point.screenX, -point.screenY);

  if (death > 0) {
    const kitPaints =
      enemy.kind === 'charger'
        ? [
            resources.paints.chargerUniform,
            resources.paints.chargerUniformDark,
            resources.paints.chargerHelmet,
            resources.paints.chargerPants,
          ]
        : [
            resources.paints.enemyUniform,
            resources.paints.enemyUniformDark,
            resources.paints.enemyHelmet,
            resources.paints.enemyPants,
          ];
    for (let i = 0; i < kitPaints.length; i += 1) {
      kitPaints[i]!.setAlphaf(1 - death);
    }
  }

  const inMelee = enemy.behavior === 'attacking' && !enemy.dying;
  const charger = enemy.kind === 'charger';

  drawSoldierAt(
    canvas,
    resources,
    {
      worldX: enemy.x,
      worldZ: enemy.z,
      elapsed: inMelee ? 0 : state.elapsed * (charger ? 1.7 : 1),
      stridePhase: inMelee ? 0 : enemy.id * 0.7,
      lean: charger ? 0.18 : 0,
      kit: charger ? 'charger' : 'enemy',
    },
    state.distance,
    width,
    height,
    { scaleMul: enemyDrawScaleMul(enemy.kind, point.scale) },
  );

  if (enemy.hitFlash > 0 && !enemy.dying) {
    const flash = enemy.hitFlash / COMBAT_CONFIG.hitFlashDuration;
    resources.paints.hitFlash.setAlphaf(0.42 * flash);
    canvas.drawCircle(
      point.screenX,
      point.screenY - muzzleScreenLift(point.scale) * 0.55,
      11 * point.scale * enemyPerspectiveScale(point.scale),
      resources.paints.hitFlash,
    );
    resources.paints.hitFlash.setAlphaf(1);
  }

  if (!enemy.dying) {
    drawHpBar(
      canvas,
      resources,
      enemy,
      point.screenX,
      point.screenY,
      enemyPerspectiveScale(point.scale),
    );
  }

  resources.paints.enemyUniform.setAlphaf(1);
  resources.paints.enemyUniformDark.setAlphaf(1);
  resources.paints.enemyHelmet.setAlphaf(1);
  resources.paints.enemyPants.setAlphaf(1);
  resources.paints.chargerUniform.setAlphaf(1);
  resources.paints.chargerUniformDark.setAlphaf(1);
  resources.paints.chargerHelmet.setAlphaf(1);
  resources.paints.chargerPants.setAlphaf(1);
  canvas.restore();
}

export function drawEnemies(
  canvas: SkCanvas,
  resources: RenderResources,
  state: GameState,
  width: number,
  height: number,
): void {
  const order = state.enemies
    .map((enemy, index) => ({ enemy, index }))
    .filter((item) => item.enemy.active)
    .sort((a, b) => b.enemy.z - a.enemy.z);

  for (let i = 0; i < order.length; i += 1) {
    const item = order[i];
    if (!item) {
      continue;
    }
    drawOneEnemy(canvas, resources, item.enemy, state, width, height);
  }
}
