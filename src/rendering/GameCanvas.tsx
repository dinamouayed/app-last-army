import { SkiaPictureView, useImage } from './skia';
import { useEffect, useRef, type RefObject } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import {
  createFrameStats,
  startGameLoop,
  updateFrameStats,
} from '../game/engine/GameLoop';
import type { GameSession } from '../game/engine/GameSession';
import { getWeaponUpgradeTier, weaponDisplayName } from '../game/config/weapons';
import { difficultyFactor } from '../game/config/difficulty';
import { GAME_CONFIG } from '../game/config/game';
import type { HudSnapshot } from '../game/types';
import { hasPendingDeathPresentation } from '../game/army/armyState';
import { currentSegmentKind } from '../game/world/worldState';
import { bossTapHintOpacity } from '../game/systems/BossTapStrikeSystem';
import { consumeFeedback } from '../feel/consumeFeedback';
import { disposeGameAudio, initGameAudio } from '../feel/GameAudio';
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
    void initGameAudio();

    const stop = startGameLoop((dt) => {
      const session = sessionRef.current;
      const { width, height } = sizeRef.current;
      if (!session || width < 2 || height < 2) {
        return;
      }

      resources.bossAtlas = bossAtlasRef.current ?? null;

      if (session.state.status === 'running') {
        session.update(dt);
      } else if (
        session.state.status === 'gameover' &&
        hasPendingDeathPresentation(session.state)
      ) {
        session.updateDeathFx(dt);
      }

      updateFrameStats(stats, dt);
      try {
        const picture = recordFrame(resources, session.state, width, height);
        publishSkiaPicture(viewRef.current, picture, pictureHolder);
      } catch (error) {
        console.error('[GameCanvas] recordFrame failed', error);
      }

      try {
        consumeFeedback(session.state);
      } catch {
        // Audio / haptics must never stall or kill the next animation frame.
      }

      hudAcc += dt;
      if (hudAcc >= GAME_CONFIG.hudUpdateInterval) {
        hudAcc = 0;
        onHudRef.current({
          distance: session.state.distance,
          armySize: session.state.armySize,
          weaponId: session.state.weaponId,
          weaponName: weaponDisplayName(
            session.state.weaponId,
            getWeaponUpgradeTier(session.state.weaponUpgradeTiers, session.state.weaponId),
          ),
          fps: stats.fps,
          elapsed: session.state.elapsed,
          hasChangedLane: session.state.hasChangedLane,
          difficulty: difficultyFactor(session.state.distance),
          nextBossDistance: session.state.nextBossDistance,
          nextBossKillThreshold: session.state.nextBossKillThreshold,
          enemiesKilled: session.state.enemiesKilled,
          runSeed: session.state.runSeed,
          segmentKind: currentSegmentKind(session.state),
          bossTapHint: bossTapHintOpacity(session.state),
        });
      }

      if (
        session.state.status === 'gameover' &&
        !hasPendingDeathPresentation(session.state) &&
        !session.gameOverNotified
      ) {
        session.gameOverNotified = true;
        onGameOverRef.current(session.state.distance);
      }
    }, GAME_CONFIG.maxDeltaSeconds);

    return () => {
      stop();
      disposeGameAudio();
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
