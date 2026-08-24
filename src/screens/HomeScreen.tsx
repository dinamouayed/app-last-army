import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScoreDisplay } from '../components/ScoreDisplay';
import { PALETTE } from '../game/config/palette';
import { HomeSceneCanvas } from '../rendering/HomeSceneCanvas';

interface HomeScreenProps {
  bestDistance: number;
  onPlay: () => void;
}

export function HomeScreen({ bestDistance, onPlay }: HomeScreenProps) {
  return (
    <View style={styles.root}>
      <HomeSceneCanvas />
      <View pointerEvents="none" style={styles.scrim} />
      <View style={styles.overlay}>
        <Text style={styles.title}>LAST ARMY</Text>
        <View style={styles.spacer} />
        <ScoreDisplay label="BEST" meters={bestDistance} />
        <Pressable
          accessibilityRole="button"
          onPress={onPlay}
          style={({ pressed }) => [styles.play, pressed && styles.playPressed]}
        >
          <Text style={styles.playLabel}>PLAY</Text>
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
    backgroundColor: 'rgba(12, 18, 28, 0.18)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 88,
    paddingBottom: 54,
  },
  title: {
    color: PALETTE.hudText,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 5,
    textShadowColor: 'rgba(8, 12, 20, 0.7)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  spacer: {
    flex: 1,
  },
  play: {
    marginTop: 22,
    backgroundColor: PALETTE.play,
    minWidth: 248,
    paddingVertical: 18,
    paddingHorizontal: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: PALETTE.playBorder,
    alignItems: 'center',
    shadowColor: '#081018',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  playPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  playLabel: {
    color: PALETTE.playLabel,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
  },
});
