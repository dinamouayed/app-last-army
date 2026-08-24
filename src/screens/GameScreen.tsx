import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

import { ExitButton } from '../components/ExitButton';
import { DevArmyControls } from '../components/DevArmyControls';
import { HUD } from '../components/HUD';
import { PALETTE } from '../game/config/palette';
import { GameSession } from '../game/engine/GameSession';
import type { HudSnapshot } from '../game/types';
import { GameCanvas } from '../rendering/GameCanvas';

interface GameScreenProps {
  onGameOver: (distance: number) => void;
  onExit: () => void;
}

export function GameScreen({ onGameOver, onExit }: GameScreenProps) {
  const sessionRef = useRef(new GameSession());
  const [hud, setHud] = useState<HudSnapshot>({
    distance: 0,
    armySize: 1,
    fps: 60,
    elapsed: 0,
    hasChangedLane: false,
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          sessionRef.current.beginSwipe();
        },
        onPanResponderMove: (_, gesture) => {
          sessionRef.current.updateSwipe(gesture.dx);
        },
        onPanResponderRelease: () => {
          sessionRef.current.endSwipe();
        },
        onPanResponderTerminate: () => {
          sessionRef.current.endSwipe();
        },
      }),
    [],
  );

  return (
    <View style={styles.root}>
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <GameCanvas
          sessionRef={sessionRef}
          onHud={setHud}
          onGameOver={onGameOver}
        />
      </View>
      <HUD
        armySize={hud.armySize}
        distance={hud.distance}
        elapsed={hud.elapsed}
        hasChangedLane={hud.hasChangedLane}
      />
      <ExitButton onPress={onExit} />
      <DevArmyControls session={sessionRef.current} />
      {__DEV__ ? (
        <Text style={styles.fps}>{Math.round(hud.fps)} FPS</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.screen,
  },
  canvas: {
    flex: 1,
  },
  fps: {
    position: 'absolute',
    left: 16,
    bottom: 28,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
});
