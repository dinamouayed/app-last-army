import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getWeapon, WEAPON_PROGRESSION, type WeaponId } from '../game/config/weapons';
import { PALETTE } from '../game/config/palette';
import type { GameSession } from '../game/engine/GameSession';
import { equipWeapon } from '../game/systems/GateSystem';

interface DevArmyControlsProps {
  session: GameSession;
}

const PRESETS = [1, 10, 50, 100, 500, 1000] as const;

export function DevArmyControls({ session }: DevArmyControlsProps) {
  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Text style={styles.label}>DEV ARMY</Text>
      <View style={styles.row}>
        <DevButton label="+10" onPress={() => session.devAddSoldiers(10)} />
        <DevButton label="+100" onPress={() => session.devAddSoldiers(100)} />
        <DevButton label="-10" onPress={() => session.devRemoveSoldiers(10)} />
        <DevButton label="=1" onPress={() => session.devSetArmySize(1)} />
      </View>
      <View style={styles.row}>
        {PRESETS.map((size) => (
          <DevButton
            key={size}
            label={String(size)}
            onPress={() => session.devSetArmySize(size)}
          />
        ))}
      </View>
      <Text style={styles.label}>DEV WEAPONS</Text>
      <View style={styles.row}>
        {WEAPON_PROGRESSION.map((weaponId) => (
          <DevButton
            key={weaponId}
            label={getWeapon(weaponId).name.slice(0, 3).toUpperCase()}
            onPress={() => equipWeapon(session.state, weaponId as WeaponId)}
          />
        ))}
      </View>
    </View>
  );
}

function DevButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
    >
      <Text style={styles.btnLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 52,
    gap: 6,
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  btn: {
    backgroundColor: 'rgba(12, 18, 28, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnLabel: {
    color: PALETTE.hudText,
    fontSize: 11,
    fontWeight: '800',
  },
});
