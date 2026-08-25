import type { SkPicture } from '@shopify/react-native-skia';

import type { SkiaPictureView } from '@shopify/react-native-skia';

import type { RenderResources } from './paints';
import { getSkiaViewApi } from './skiaApi';

export interface SkPictureHolder {
  current: SkPicture | null;
}

export function createSkPictureHolder(): SkPictureHolder {
  return { current: null };
}

export function publishSkiaPicture(
  view: SkiaPictureView | null,
  picture: SkPicture,
  holder: SkPictureHolder,
): void {
  const api = getSkiaViewApi();
  if (!view || !api) {
    picture.dispose();
    return;
  }

  holder.current?.dispose();
  api.setJsiProperty(view.nativeId, 'picture', picture);
  holder.current = picture;
  view.redraw();
}

export function disposeSkPictureHolder(holder: SkPictureHolder): void {
  holder.current?.dispose();
  holder.current = null;
}

export function disposeRenderResources(resources: RenderResources): void {
  const { paints, path, recorder } = resources;
  for (const key of Object.keys(paints) as (keyof typeof paints)[]) {
    paints[key].dispose();
  }
  path.dispose();
  recorder.dispose();
}
