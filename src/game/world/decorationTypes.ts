export type RoadDetailKind = 'patch' | 'crack' | 'tire' | 'grain' | 'stain' | 'edge';

export type RoadsideKind =
  | 'barrier'
  | 'sandbag'
  | 'crate'
  | 'barrel'
  | 'rubble'
  | 'container'
  | 'pole'
  | 'fence'
  | 'block'
  | 'sign';

export type DistantKind = 'ruin' | 'tower' | 'antenna' | 'smoke' | 'warehouse';

export interface RoadDetail {
  kind: RoadDetailKind;
  x: number;
  z: number;
  width: number;
  length: number;
  seed: number;
}

export interface RoadsideDecoration {
  kind: RoadsideKind;
  x: number;
  z: number;
  seed: number;
}

export interface DistantDecoration {
  kind: DistantKind;
  x: number;
  z: number;
  seed: number;
}

export interface TerrainPatch {
  x: number;
  z: number;
  width: number;
  length: number;
  seed: number;
  tone: number;
}
