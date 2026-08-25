import { SkiaPictureView } from '@shopify/react-native-skia';
import { useEffect, useRef, type RefObject } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import {
  createFrameStats,
  startGameLoop,
  updateFrameStats,
} from '../game/engine/GameLoop';
import type { GameSession } from '../game/engine/GameSession';
import { getWeapon } from '../game/config/weapons';
import { GAME_CONFIG } from '../game/config/game';
import type { HudSnapshot } from '../game/types';
import { createRenderResources } from './paints';
import { recordFrame } from './recordFrame';
import { getSkiaViewApi } from './skiaApi';

interface GameCanvasProps {
  sessionRef: RefObject<GameSession | null>;
  onHud: (snapshot: HudSnapshot) => void;
  onGameOver: (distance: number) => void;
}

export function GameCanvas({ sessionRef, onHud, onGameOver }: GameCanvasProps) {
  const viewRef = useRef<SkiaPictureView>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const onHudRef = useRef(onHud);
  const onGameOverRef = useRef(onGameOver);
  onHudRef.current = onHud;
  onGameOverRef.current = onGameOver;

  const handleLayout = (event: LayoutChangeEvent) => {
    sizeRef.current = {
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    };
  };

  useEffect(() => {
    const resources = createRenderResources();
    const stats = createFrameStats();
    let hudAcc = 0;

    const stop = startGameLoop((dt) => {
      const session = sessionRef.current;
      const { width, height } = sizeRef.current;
      if (!session || width < 2 || height < 2) {
        return;
      }

      if (session.state.status === 'running') {
        session.update(dt);
      }

      updateFrameStats(stats, dt);
      const picture = recordFrame(resources, session.state, width, height);
      const view = viewRef.current;
      const api = getSkiaViewApi();
      if (view && api) {
        api.setJsiProperty(view.nativeId, 'picture', picture);
        view.redraw();
      }

      hudAcc += dt;
      if (hudAcc >= GAME_CONFIG.hudUpdateInterval) {
        hudAcc = 0;
        onHudRef.current({
          distance: session.state.distance,
          armySize: session.state.armySize,
          weaponId: session.state.weaponId,
          weaponName: getWeapon(session.state.weaponId).name,
          fps: stats.fps,
          elapsed: session.state.elapsed,
          hasChangedLane: session.state.hasChangedLane,
        });
      }

      if (session.state.status === 'gameover' && !session.gameOverNotified) {
        session.gameOverNotified = true;
        onGameOverRef.current(session.state.distance);
      }
    }, GAME_CONFIG.maxDeltaSeconds);

    return stop;
  }, [sessionRef]);

  return (
    <View style={styles.canvas} onLayout={handleLayout}>
      <SkiaPictureView ref={viewRef} opaque style={styles.canvas} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
