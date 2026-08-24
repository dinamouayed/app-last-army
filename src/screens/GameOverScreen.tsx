import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScoreDisplay } from '../components/ScoreDisplay';
import { PALETTE } from '../game/config/palette';
import { HomeSceneCanvas } from '../rendering/HomeSceneCanvas';

interface GameOverScreenProps {
  distance: number;
  bestDistance: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
}

export function GameOverScreen({
  distance,
  bestDistance,
  isNewBest,
  onPlayAgain,
}: GameOverScreenProps) {
  return (
    <View style={styles.root}>
      <HomeSceneCanvas />
      <View pointerEvents="none" style={styles.scrim} />
      <View style={styles.overlay}>
        <Text style={styles.title}>GAME OVER</Text>
        {isNewBest ? <Text style={styles.newBest}>NEW BEST!</Text> : null}
        <ScoreDisplay label="DISTANCE" meters={distance} emphasize={isNewBest} />
        <ScoreDisplay label="BEST" meters={bestDistance} />
        <Pressable
          accessibilityRole="button"
          onPress={onPlayAgain}
          style={({ pressed }) => [styles.play, pressed && styles.playPressed]}
        >
          <Text style={styles.playLabel}>PLAY AGAIN</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.screen,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 18, 28, 0.28)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    color: PALETTE.hudText,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: 'rgba(8, 12, 20, 0.7)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  newBest: {
    color: PALETTE.accent,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  play: {
    marginTop: 18,
    backgroundColor: PALETTE.play,
    minWidth: 248,
    paddingVertical: 18,
    paddingHorizontal: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: PALETTE.playBorder,
    alignItems: 'center',
  },
  playPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  playLabel: {
    color: PALETTE.playLabel,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
