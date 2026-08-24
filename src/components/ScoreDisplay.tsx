import { StyleSheet, Text, View } from 'react-native';

import { PALETTE } from '../game/config/palette';
import { formatDistance } from '../game/math/format';

interface ScoreDisplayProps {
  label: string;
  meters: number;
  emphasize?: boolean;
}

export function ScoreDisplay({ label, meters, emphasize }: ScoreDisplayProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, emphasize && styles.emphasize]}>
        {formatDistance(meters)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: '#f4f8ff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textShadowColor: 'rgba(20, 40, 10, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  value: {
    color: PALETTE.hudText,
    fontSize: 32,
    fontWeight: '800',
    textShadowColor: 'rgba(20, 40, 10, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  emphasize: {
    color: PALETTE.accent,
  },
});
