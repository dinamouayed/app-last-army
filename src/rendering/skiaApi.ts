import type { ISkiaViewApi } from '@shopify/react-native-skia';

export function getSkiaViewApi(): ISkiaViewApi | null {
  const api = (globalThis as typeof globalThis & { SkiaViewApi?: ISkiaViewApi })
    .SkiaViewApi;
  return api ?? null;
}
