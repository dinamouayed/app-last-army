import { StyleSheet, Text, View } from 'react-native';

import { PALETTE } from '../game/config/palette';
import { GAME_CONFIG } from '../game/config/game';
import { formatDistance } from '../game/math/format';

interface HUDProps {
  armySize: number;
  distance: number;
  elapsed: number;
  hasChangedLane: boolean;
}

function swipeHintOpacity(elapsed: number, hasChangedLane: boolean): number {
  if (hasChangedLane || elapsed >= GAME_CONFIG.swipeHintDuration) {
    return 0;
  }
  if (elapsed < 0.25) {
    return (elapsed / 0.25) * 0.92;
  }
  const fadeStart = GAME_CONFIG.swipeHintDuration - 0.55;
  if (elapsed > fadeStart) {
    return 0.92 * (1 - (elapsed - fadeStart) / 0.55);
  }
  return 0.92;
}

export function HUD({
  armySize,
  distance,
  elapsed,
  hasChangedLane,
}: HUDProps) {
  const hintOpacity = swipeHintOpacity(elapsed, hasChangedLane);

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.top}>
        <View style={styles.army}>
          <View style={styles.armyIcon}>
            <View style={styles.helmet} />
            <View style={styles.head} />
          </View>
          <Text style={styles.armyCount}>{Math.max(0, Math.floor(armySize))}</Text>
        </View>
        <Text style={styles.distance}>{formatDistance(distance)}</Text>
        <View style={styles.sideSpacer} />
      </View>
      {hintOpacity > 0.02 ? (
        <Text style={[styles.hint, { opacity: hintOpacity }]}>←  SWIPE  →</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
  },
  top: {
    marginTop: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  army: {
    width: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  armyIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  helmet: {
    position: 'absolute',
    top: 0,
    width: 16,
    height: 10,
    borderRadius: 8,
    backgroundColor: PALETTE.soldierHelmet,
  },
  head: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PALETTE.soldierUniform,
    marginBottom: 1,
  },
  armyCount: {
    color: PALETTE.hudText,
    fontSize: 20,
    fontWeight: '800',
    textShadowColor: 'rgba(20,40,10,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sideSpacer: {
    width: 88,
  },
  distance: {
    color: PALETTE.hudText,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(20,40,10,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '24%',
    textAlign: 'center',
    color: PALETTE.hudText,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
    textShadowColor: 'rgba(20,40,10,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});
