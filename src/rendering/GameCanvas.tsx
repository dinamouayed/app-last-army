import { SkiaPictureView, useImage } from './skia';
import { useEffect, useRef, type RefObject } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import {
  createFrameStats,
  startGameLoop,
  updateFrameStats,
} from '../game/engine/GameLoop';
import type { GameSession } from '../game/engine/GameSession';
import { getWeapon } from '../game/config/weapons';
import { difficultyFactor } from '../game/config/difficulty';
import { GAME_CONFIG } from '../game/config/game';
import type { HudSnapshot } from '../game/types';
import { currentSegmentKind } from '../game/world/worldState';
import { createRenderResources } from './paints';
import { recordFrame } from './recordFrame';
import {
  createSkPictureHolder,
  disposeRenderResources,
  disposeSkPictureHolder,
  publishSkiaPicture,
} from './skiaPicture';

const BOSS_ATLAS_SOURCE = require('../../assets/boss/boss-atlas.png');

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
  const bossAtlas = useImage(BOSS_ATLAS_SOURCE);
  const bossAtlasRef = useRef(bossAtlas);
  bossAtlasRef.current = bossAtlas;
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
    const pictureHolder = createSkPictureHolder();
    const stats = createFrameStats();
    let hudAcc = 0;

    const stop = startGameLoop((dt) => {
      const session = sessionRef.current;
      const { width, height } = sizeRef.current;
      if (!session || width < 2 || height < 2) {
        return;
      }

      resources.bossAtlas = bossAtlasRef.current ?? null;

      if (session.state.status === 'running') {
        session.update(dt);
      }

      updateFrameStats(stats, dt);
      try {
        const picture = recordFrame(resources, session.state, width, height);
        publishSkiaPicture(viewRef.current, picture, pictureHolder);
      } catch (error) {
        console.error('[GameCanvas] recordFrame failed', error);
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
          difficulty: difficultyFactor(session.state.distance),
          nextBossDistance: session.state.nextBossDistance,
          runSeed: session.state.runSeed,
          segmentKind: currentSegmentKind(session.state),
        });
      }

      if (session.state.status === 'gameover' && !session.gameOverNotified) {
        session.gameOverNotified = true;
        onGameOverRef.current(session.state.distance);
      }
    }, GAME_CONFIG.maxDeltaSeconds);

    return () => {
      stop();
      disposeSkPictureHolder(pictureHolder);
      disposeRenderResources(resources);
    };
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
