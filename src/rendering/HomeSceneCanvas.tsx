import { SkiaPictureView } from '@shopify/react-native-skia';
import { useEffect, useRef } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { GAME_CONFIG } from '../game/config/game';
import { startGameLoop } from '../game/engine/GameLoop';
import { createGameState } from '../game/engine/GameState';
import { createRenderResources } from './paints';
import { recordHomeFrame } from './recordFrame';
import { getSkiaViewApi } from './skiaApi';

export function HomeSceneCanvas() {
  const viewRef = useRef<SkiaPictureView>(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    sizeRef.current = {
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    };
  };

  useEffect(() => {
    const resources = createRenderResources();
    const state = createGameState();

    const stop = startGameLoop((dt) => {
      const { width, height } = sizeRef.current;
      if (width < 2 || height < 2) {
        return;
      }

      state.elapsed += dt;
      state.distance += GAME_CONFIG.forwardSpeed * 0.55 * dt;

      const picture = recordHomeFrame(resources, state, width, height);
      const view = viewRef.current;
      const api = getSkiaViewApi();
      if (view && api) {
        api.setJsiProperty(view.nativeId, 'picture', picture);
        view.redraw();
      }
    }, GAME_CONFIG.maxDeltaSeconds);

    return stop;
  }, []);

  return (
    <View style={styles.canvas} onLayout={handleLayout}>
      <SkiaPictureView ref={viewRef} opaque style={styles.canvas} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFill,
  },
});
