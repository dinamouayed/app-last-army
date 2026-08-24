import type { SkCanvas, SkPaint } from '@shopify/react-native-skia';

import { ENVIRONMENT_CONFIG } from '../game/config/environment';
import { GAME_CONFIG } from '../game/config/game';
import { hash01, hashRange } from '../game/math/hash';
import type { RoadDetail } from '../game/world/decorationTypes';
import type { WorldDecorations } from '../game/world/EnvironmentSystem';
import { drawQuad, drawWorldQuad, project } from './drawHelpers';
import type { RenderResources } from './paints';

function asphaltPaint(resources: RenderResources, seed: number): SkPaint {
  const tone = hash01(seed);
  if (tone < 0.34) {
    return resources.paints.roadDark;
  }
  if (tone < 0.72) {
    return resources.paints.road;
  }
  return resources.paints.asphaltWorn;
}

function drawAsphaltBands(
  canvas: SkCanvas,
  resources: RenderResources,
  cameraZ: number,
  width: number,
  height: number,
): void {
  const { camera } = GAME_CONFIG;
  const nearZ = cameraZ + camera.zClip;
  const farZ = cameraZ + camera.zFar;
  const half = camera.roadHalfWidth;
  const band = ENVIRONMENT_CONFIG.asphaltBandLength;
  const first = Math.floor(nearZ / band) * band;

  for (let z = first; z < farZ; z += band) {
    const z0 = Math.max(z, nearZ);
    const z1 = Math.min(z + band + 0.08, farZ);
    if (z1 <= z0) {
      continue;
    }
    const n = Math.round(z * 10);
    const leftJitter = hashRange(n + 1, -0.03, 0.03);
    const rightJitter = hashRange(n + 2, -0.03, 0.03);
    drawWorldQuad(
      canvas,
      resources.path,
      cameraZ,
      width,
      height,
      -half + leftJitter,
      z0,
      half + rightJitter,
      z0,
      half + hashRange(n + 3, -0.03, 0.03),
      z1,
      -half + hashRange(n + 4, -0.03, 0.03),
      z1,
      asphaltPaint(resources, n),
    );
  }
}

function drawShoulder(
  canvas: SkCanvas,
  resources: RenderResources,
  cameraZ: number,
  width: number,
  height: number,
): void {
  const { camera } = GAME_CONFIG;
  const nearZ = cameraZ + camera.zClip;
  const farZ = cameraZ + camera.zFar;
  const inner = camera.roadHalfWidth;
  const outer = camera.roadHalfWidth + 0.32;

  drawWorldQuad(
    canvas,
    resources.path,
    cameraZ,
    width,
    height,
    -outer,
    nearZ,
    -inner + 0.02,
    nearZ,
    -inner,
    farZ,
    -outer,
    farZ,
    resources.paints.roadShoulder,
  );
  drawWorldQuad(
    canvas,
    resources.path,
    cameraZ,
    width,
    height,
    inner - 0.02,
    nearZ,
    outer,
    nearZ,
    outer,
    farZ,
    inner,
    farZ,
    resources.paints.roadShoulder,
  );
  resources.paints.roadEdge.setAlphaf(0.55);
  drawWorldQuad(
    canvas,
    resources.path,
    cameraZ,
    width,
    height,
    -inner,
    nearZ,
    -inner + 0.07,
    nearZ,
    -inner + 0.05,
    farZ,
    -inner - 0.02,
    farZ,
    resources.paints.roadEdge,
  );
  drawWorldQuad(
    canvas,
    resources.path,
    cameraZ,
    width,
    height,
    inner - 0.07,
    nearZ,
    inner,
    nearZ,
    inner + 0.02,
    farZ,
    inner - 0.05,
    farZ,
    resources.paints.roadEdge,
  );
  resources.paints.roadEdge.setAlphaf(1);
}

function drawIrregularPatch(
  canvas: SkCanvas,
  resources: RenderResources,
  detail: RoadDetail,
  cameraZ: number,
  width: number,
  height: number,
  paint: SkPaint,
): void {
  const j = 0.11;
  const s = detail.seed;
  const hw = detail.width * 0.5;
  drawWorldQuad(
    canvas,
    resources.path,
    cameraZ,
    width,
    height,
    detail.x - hw + hashRange(s, -j, j),
    detail.z + hashRange(s + 1, 0, 0.18),
    detail.x + hw + hashRange(s + 2, -j, j),
    detail.z + hashRange(s + 3, 0, 0.2),
    detail.x + hw + hashRange(s + 4, -j, j * 1.2),
    detail.z + detail.length + hashRange(s + 5, -0.12, 0.18),
    detail.x - hw + hashRange(s + 6, -j, j),
    detail.z + detail.length + hashRange(s + 7, -0.1, 0.16),
    paint,
  );
}

function drawCrack(
  canvas: SkCanvas,
  resources: RenderResources,
  detail: RoadDetail,
  cameraZ: number,
  width: number,
  height: number,
): void {
  const start = project(detail.x, detail.z, cameraZ, width, height);
  resources.paints.crack.setStrokeWidth(Math.max(1, 1.05 + start.scale * 2.3));
  resources.paints.crack.setAlphaf(0.26 + Math.min(0.42, start.scale * 0.4));

  let x = detail.x;
  let z = detail.z;
  const steps = 4;
  const step = detail.length / steps;
  for (let i = 0; i < steps; i += 1) {
    const nx = x + hashRange(detail.seed + i * 9, -0.28, 0.28);
    const nz = z + step;
    const a = project(x, z, cameraZ, width, height);
    const b = project(nx, nz, cameraZ, width, height);
    canvas.drawLine(a.screenX, a.screenY, b.screenX, b.screenY, resources.paints.crack);

    if (hash01(detail.seed + i + 70) > 0.55) {
      const bx = nx + hashRange(detail.seed + i + 80, -0.32, 0.32);
      const bz = nz + hashRange(detail.seed + i + 90, 0.35, 1.1);
      const c = project(bx, bz, cameraZ, width, height);
      canvas.drawLine(b.screenX, b.screenY, c.screenX, c.screenY, resources.paints.crack);
    }
    x = nx;
    z = nz;
  }

  resources.paints.crack.setAlphaf(1);
}

function drawTireMark(
  canvas: SkCanvas,
  resources: RenderResources,
  detail: RoadDetail,
  cameraZ: number,
  width: number,
  height: number,
): void {
  const start = project(detail.x, detail.z, cameraZ, width, height);
  const length = detail.length * hashRange(detail.seed + 4, 0.45, 1);
  resources.paints.tireMark.setAlphaf(0.12 + Math.min(0.16, start.scale * 0.14));
  const wobble = hashRange(detail.seed + 11, -0.03, 0.03);
  drawWorldQuad(
    canvas,
    resources.path,
    cameraZ,
    width,
    height,
    detail.x - detail.width,
    detail.z,
    detail.x + detail.width,
    detail.z,
    detail.x + detail.width + wobble,
    detail.z + length,
    detail.x - detail.width + wobble,
    detail.z + length,
    resources.paints.tireMark,
  );
  resources.paints.tireMark.setAlphaf(1);
}

function drawLaneMarkings(
  canvas: SkCanvas,
  resources: RenderResources,
  cameraZ: number,
  width: number,
  height: number,
): void {
  const { camera, laneSpacing } = GAME_CONFIG;
  const nearZ = cameraZ + camera.zClip;
  const farZ = cameraZ + camera.zFar;
  const markLength = 4.5;
  const gap = 5.5;
  const period = markLength + gap;
  const firstZ = Math.floor(nearZ / period) * period;
  const dividers = [-laneSpacing * 0.5, laneSpacing * 0.5];

  for (let z = firstZ; z < farZ; z += period) {
    const n = Math.round(z * 10);
    if (hash01(n + 5) < 0.1) {
      continue;
    }
    const worn = 0.58 + hash01(n + 8) * 0.3;
    const length = markLength * hashRange(n + 12, 0.78, 1);
    const z1 = z + length;
    if (z1 < nearZ) {
      continue;
    }
    resources.paints.laneLine.setAlphaf(worn);
    for (const dividerX of dividers) {
      const jitter = hashRange(n + dividerX * 20, -0.012, 0.012);
      const half = hashRange(n + 16, 0.028, 0.04);
      drawWorldQuad(
        canvas,
        resources.path,
        cameraZ,
        width,
        height,
        dividerX - half + jitter,
        z,
        dividerX + half + jitter,
        z,
        dividerX + half + jitter * 0.4,
        z1,
        dividerX - half + jitter * 0.4,
        z1,
        resources.paints.laneLine,
      );
    }
  }
  resources.paints.laneLine.setAlphaf(1);
}

function drawRoadDetails(
  canvas: SkCanvas,
  resources: RenderResources,
  details: RoadDetail[],
  cameraZ: number,
  width: number,
  height: number,
): void {
  for (const detail of details) {
    if (detail.kind === 'patch') {
      if (hash01(detail.seed + 44) > 0.5) {
        drawIrregularPatch(
          canvas,
          resources,
          detail,
          cameraZ,
          width,
          height,
          resources.paints.asphaltPatch,
        );
      } else {
        drawIrregularPatch(
          canvas,
          resources,
          detail,
          cameraZ,
          width,
          height,
          resources.paints.asphaltWorn,
        );
      }
    }
  }

  for (const detail of details) {
    if (detail.kind === 'tire') {
      drawTireMark(canvas, resources, detail, cameraZ, width, height);
    }
  }

  for (const detail of details) {
    if (detail.kind === 'stain') {
      const point = project(detail.x, detail.z, cameraZ, width, height);
      resources.paints.roadDark.setAlphaf(0.18 + point.scale * 0.12);
      canvas.drawOval(
        {
          x: point.screenX - 10 * point.scale * detail.width,
          y: point.screenY - 4 * point.scale,
          width: 22 * point.scale * detail.width,
          height: 8 * point.scale,
        },
        resources.paints.roadDark,
      );
      resources.paints.roadDark.setAlphaf(1);
    }
  }

  for (const detail of details) {
    if (detail.kind === 'grain') {
      const point = project(detail.x, detail.z, cameraZ, width, height);
      if (point.scale < 0.28) {
        continue;
      }
      const paint =
        hash01(detail.seed) > 0.5
          ? resources.paints.asphaltGrain
          : resources.paints.asphaltWorn;
      paint.setAlphaf(0.35 + point.scale * 0.25);
      drawWorldQuad(
        canvas,
        resources.path,
        cameraZ,
        width,
        height,
        detail.x - detail.width * 0.5,
        detail.z,
        detail.x + detail.width * 0.5,
        detail.z,
        detail.x + detail.width * 0.4,
        detail.z + detail.length,
        detail.x - detail.width * 0.35,
        detail.z + detail.length,
        paint,
      );
      paint.setAlphaf(1);
    }
  }

  for (const detail of details) {
    if (detail.kind === 'crack') {
      if (hash01(detail.seed + 3) > 0.55) {
        drawIrregularPatch(
          canvas,
          resources,
          {
            ...detail,
            width: 0.22,
            length: detail.length * 0.45,
          },
          cameraZ,
          width,
          height,
          resources.paints.asphaltPatch,
        );
      }
      drawCrack(canvas, resources, detail, cameraZ, width, height);
    }
  }

  for (const detail of details) {
    if (detail.kind !== 'edge') {
      continue;
    }
    const point = project(detail.x, detail.z, cameraZ, width, height);
    if (point.scale < 0.22) {
      continue;
    }
    resources.paints.gravel.setAlphaf(0.4 + point.scale * 0.35);
    canvas.drawOval(
      {
        x: point.screenX - 5 * point.scale,
        y: point.screenY - 3 * point.scale,
        width: 9 * point.scale,
        height: 5 * point.scale,
      },
      resources.paints.gravel,
    );
    resources.paints.rubble.setAlphaf(0.35 + point.scale * 0.3);
    canvas.drawOval(
      {
        x: point.screenX - 2 * point.scale,
        y: point.screenY - 2 * point.scale,
        width: 6 * point.scale,
        height: 4 * point.scale,
      },
      resources.paints.rubble,
    );
    resources.paints.gravel.setAlphaf(1);
    resources.paints.rubble.setAlphaf(1);
  }
}

export function drawRoad(
  canvas: SkCanvas,
  resources: RenderResources,
  decorations: WorldDecorations,
  cameraZ: number,
  width: number,
  height: number,
): void {
  const { camera } = GAME_CONFIG;
  const nearZ = cameraZ + camera.zClip;
  const farZ = cameraZ + camera.zFar;

  drawShoulder(canvas, resources, cameraZ, width, height);

  drawQuad(
    canvas,
    resources.path,
    project(-camera.roadHalfWidth, nearZ, cameraZ, width, height),
    project(camera.roadHalfWidth, nearZ, cameraZ, width, height),
    project(camera.roadHalfWidth, farZ, cameraZ, width, height),
    project(-camera.roadHalfWidth, farZ, cameraZ, width, height),
    resources.paints.road,
  );

  drawAsphaltBands(canvas, resources, cameraZ, width, height);
  drawRoadDetails(canvas, resources, decorations.roadDetails, cameraZ, width, height);
  drawLaneMarkings(canvas, resources, cameraZ, width, height);
}
