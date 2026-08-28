import type { SkCanvas } from '@shopify/react-native-skia';

import { COMBAT_CONFIG } from '../game/config/combat';
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
    resources.paints.enemyUniform.setAlphaf(1 - death);
    resources.paints.enemyUniformDark.setAlphaf(1 - death);
    resources.paints.enemyHelmet.setAlphaf(1 - death);
    resources.paints.enemyPants.setAlphaf(1 - death);
  }

  const inMelee = enemy.behavior === 'attacking' && !enemy.dying;

  drawSoldierAt(
    canvas,
    resources,
    {
      worldX: enemy.x,
      worldZ: enemy.z,
      elapsed: inMelee ? 0 : state.elapsed,
      stridePhase: inMelee ? 0 : enemy.id * 0.7,
      kit: 'enemy',
    },
    state.distance,
    width,
    height,
  );

  if (!enemy.dying) {
    drawHpBar(canvas, resources, enemy, point.screenX, point.screenY, point.scale);
  }

  resources.paints.enemyUniform.setAlphaf(1);
  resources.paints.enemyUniformDark.setAlphaf(1);
  resources.paints.enemyHelmet.setAlphaf(1);
  resources.paints.enemyPants.setAlphaf(1);
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
