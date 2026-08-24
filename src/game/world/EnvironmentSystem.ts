import { ENVIRONMENT_CONFIG } from '../config/environment';
import { GAME_CONFIG } from '../config/game';
import { hash01, hashRange } from '../math/hash';
import type {
  DistantDecoration,
  DistantKind,
  RoadDetail,
  RoadDetailKind,
  RoadsideDecoration,
  RoadsideKind,
  TerrainPatch,
} from './decorationTypes';

export interface WorldDecorations {
  roadDetails: RoadDetail[];
  roadside: RoadsideDecoration[];
  distant: DistantDecoration[];
  terrain: TerrainPatch[];
}

const decorations: WorldDecorations = {
  roadDetails: [],
  roadside: [],
  distant: [],
  terrain: [],
};

const roadDetailPool: RoadDetail[] = [];
const roadsidePool: RoadsideDecoration[] = [];
const distantPool: DistantDecoration[] = [];
const terrainPool: TerrainPatch[] = [];

const roadsideKinds: RoadsideKind[] = [
  'barrier',
  'sandbag',
  'crate',
  'barrel',
  'rubble',
  'container',
  'pole',
  'fence',
  'block',
  'sign',
];

const distantKinds: DistantKind[] = [
  'ruin',
  'tower',
  'antenna',
  'smoke',
  'warehouse',
];

function clear(list: { length: number }): void {
  list.length = 0;
}

function acquireFrom<T>(
  pool: T[],
  live: T[],
  max: number,
  factory: () => T,
): T | null {
  if (live.length >= max) {
    return null;
  }
  let item = pool[live.length];
  if (!item) {
    item = factory();
    pool[live.length] = item;
  }
  live.push(item);
  return item;
}

function pushRoadDetail(
  kind: RoadDetailKind,
  z: number,
  seed: number,
  x: number,
  width: number,
  length: number,
): void {
  const item = acquireFrom(roadDetailPool, decorations.roadDetails, ENVIRONMENT_CONFIG.maxRoadDetails, () => ({
    kind: 'grain' as RoadDetailKind,
    x: 0,
    z: 0,
    width: 0,
    length: 0,
    seed: 0,
  }));
  if (!item) {
    return;
  }
  item.kind = kind;
  item.z = z;
  item.seed = seed;
  item.x = x;
  item.width = width;
  item.length = length;
}

function collectAlong(
  cameraZ: number,
  spacing: number,
  startOffset: number,
  endZ: number,
  onCell: (z: number, n: number) => void,
): void {
  const first = Math.floor((cameraZ + startOffset) / spacing) * spacing;
  for (let z = first; z < endZ; z += spacing) {
    if (z < cameraZ + startOffset) {
      continue;
    }
    onCell(z, Math.round(z * 10));
  }
}

function collectRoadDetails(cameraZ: number): void {
  const { camera } = GAME_CONFIG;
  const farZ = cameraZ + camera.zFar;
  const midZ = cameraZ + camera.playerDepth * 3.2;
  const road = camera.roadHalfWidth - 0.12;

  collectAlong(cameraZ, ENVIRONMENT_CONFIG.patchSpacing, camera.zClip, farZ, (z, n) => {
    if (hash01(n + 3) < 0.42) {
      return;
    }
    pushRoadDetail(
      'patch',
      z,
      n,
      hashRange(n + 8, -0.85, 0.85),
      hashRange(n + 12, 0.42, 0.9),
      hashRange(n + 16, 1.6, 2.8),
    );
  });

  collectAlong(cameraZ, ENVIRONMENT_CONFIG.crackSpacing, camera.zClip, farZ, (z, n) => {
    if (hash01(n + 6) < 0.48) {
      return;
    }
    pushRoadDetail(
      'crack',
      z,
      n,
      hashRange(n + 14, -0.7, 0.7),
      0.04,
      hashRange(n + 19, 3.2, 5.4),
    );
  });

  collectAlong(cameraZ, ENVIRONMENT_CONFIG.tireSpacing, camera.zClip, farZ, (z, n) => {
    if (hash01(n + 7) < 0.5) {
      return;
    }
    const lane = hash01(n + 20) > 0.5 ? 0.38 : -0.38;
    pushRoadDetail(
      'tire',
      z,
      n,
      lane + hashRange(n + 24, -0.08, 0.08),
      0.045,
      hashRange(n + 28, 5, 9),
    );
  });

  collectAlong(cameraZ, ENVIRONMENT_CONFIG.stainSpacing, camera.zClip, farZ * 0.7, (z, n) => {
    if (hash01(n + 9) < 0.68) {
      return;
    }
    pushRoadDetail(
      'stain',
      z,
      n,
      hashRange(n + 33, -road * 0.8, road * 0.8),
      hashRange(n + 36, 0.18, 0.4),
      hashRange(n + 39, 0.4, 0.9),
    );
  });

  collectAlong(cameraZ, ENVIRONMENT_CONFIG.edgeSpacing, camera.zClip, midZ + 8, (z, n) => {
    for (const side of [-1, 1]) {
      if (hash01(n + side * 13) < 0.22) {
        continue;
      }
      pushRoadDetail(
        'edge',
        z + hashRange(n + side + 2, 0, 1.1),
        n + side,
        side * (camera.roadHalfWidth - 0.02 + hashRange(n + side * 5, -0.04, 0.08)),
        hashRange(n + side * 8, 0.08, 0.2),
        hashRange(n + side * 11, 0.22, 0.55),
      );
    }
  });

  collectAlong(cameraZ, ENVIRONMENT_CONFIG.grainSpacing, camera.zClip, midZ, (z, n) => {
    const count = 2 + Math.floor(hash01(n + 2) * 2);
    for (let i = 0; i < count; i += 1) {
      pushRoadDetail(
        'grain',
        z + hashRange(n + i + 5, 0, 1.4),
        n + i,
        hashRange(n + i + 11, -road, road),
        hashRange(n + i + 21, 0.08, 0.2),
        hashRange(n + i + 31, 0.18, 0.45),
      );
    }
  });
}

function collectTerrain(cameraZ: number): void {
  const { camera } = GAME_CONFIG;
  const farZ = cameraZ + camera.zFar;
  const inner = camera.roadHalfWidth + 0.22;

  collectAlong(cameraZ, ENVIRONMENT_CONFIG.terrainSpacing, camera.zClip, farZ, (z, n) => {
    for (const side of [-1, 1]) {
      if (hash01(n + side * 7) < 0.2) {
        continue;
      }
      const item = acquireFrom(terrainPool, decorations.terrain, ENVIRONMENT_CONFIG.maxTerrain, () => ({
        x: 0,
        z: 0,
        width: 0,
        length: 0,
        seed: 0,
        tone: 0,
      }));
      if (!item) {
        return;
      }
      const offset = hashRange(n + side * 19, 0.15, 2.4);
      item.x = side * (inner + offset);
      item.z = z;
      item.seed = n + side;
      item.width = hashRange(n + side * 21, 0.7, 1.8);
      item.length = hashRange(n + side * 25, 2.2, 4.4);
      item.tone = hash01(n + side * 29);
    }
  });
}

function collectRoadside(cameraZ: number): void {
  const { camera } = GAME_CONFIG;
  const farZ = cameraZ + camera.zFar;
  const edge = camera.roadHalfWidth + 0.55;

  collectAlong(
    cameraZ,
    ENVIRONMENT_CONFIG.roadsideSpacing,
    camera.zClip,
    farZ,
    (z, n) => {
      for (const side of [-1, 1]) {
        const roll = hash01(n + (side > 0 ? 91 : 4));
        if (roll < 0.12) {
          continue;
        }
        const item = acquireFrom(
          roadsidePool,
          decorations.roadside,
          ENVIRONMENT_CONFIG.maxRoadside,
          () => ({ kind: 'rubble' as RoadsideKind, x: 0, z: 0, seed: 0 }),
        );
        if (!item) {
          return;
        }
        const kind =
          roadsideKinds[Math.floor(hash01(n + side * 17) * roadsideKinds.length)] ??
          'rubble';
        const farther = hash01(n + side * 41) > 0.72;
        item.kind = kind;
        item.z = z;
        item.seed = n + side;
        item.x = side * (edge + hashRange(n + side * 23, 0.05, farther ? 1.55 : 0.85));
      }
    },
  );
}

function collectDistant(cameraZ: number): void {
  const { camera } = GAME_CONFIG;
  const farZ = cameraZ + camera.zFar;

  collectAlong(
    cameraZ,
    ENVIRONMENT_CONFIG.distantSpacing,
    camera.playerDepth * 2.2,
    farZ,
    (z, n) => {
      for (const side of [-1, 1]) {
        if (hash01(n + side * 40) < 0.28) {
          continue;
        }
        const item = acquireFrom(
          distantPool,
          decorations.distant,
          ENVIRONMENT_CONFIG.maxDistant,
          () => ({ kind: 'ruin' as DistantKind, x: 0, z: 0, seed: 0 }),
        );
        if (!item) {
          return;
        }
        const kind =
          distantKinds[Math.floor(hash01(n + side * 55) * distantKinds.length)] ?? 'ruin';
        item.kind = kind;
        item.z = z;
        item.seed = n + side;
        item.x = side * hashRange(n + side * 60, 2.5, 5.9);
      }
    },
  );

  for (let i = 0; i < 9; i += 1) {
    const item = acquireFrom(
      distantPool,
      decorations.distant,
      ENVIRONMENT_CONFIG.maxDistant,
      () => ({ kind: 'ruin' as DistantKind, x: 0, z: 0, seed: 0 }),
    );
    if (!item) {
      break;
    }
    const n = i * 31;
    const side = i < 4 ? -1 : 1;
    item.kind = hash01(n) > 0.7 ? 'warehouse' : 'ruin';
    item.z = farZ - 0.8;
    item.seed = n;
    item.x = side * hashRange(n + 3, 2.4, 6.2);
  }
}

export function buildWorldDecorations(cameraZ: number): WorldDecorations {
  clear(decorations.roadDetails);
  clear(decorations.roadside);
  clear(decorations.distant);
  clear(decorations.terrain);
  collectRoadDetails(cameraZ);
  collectTerrain(cameraZ);
  collectRoadside(cameraZ);
  collectDistant(cameraZ);
  return decorations;
}

export function sortFarToNear<T extends { z: number }>(items: T[]): T[] {
  items.sort((a, b) => b.z - a.z);
  return items;
}
