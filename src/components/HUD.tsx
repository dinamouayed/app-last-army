import { StyleSheet, Text, View } from 'react-native';

import { PALETTE } from '../game/config/palette';
import { GAME_CONFIG } from '../game/config/game';
import { formatDistance } from '../game/math/format';

interface HUDProps {
  armySize: number;
  distance: number;
  weaponName: string;
  elapsed: number;
  hasChangedLane: boolean;
  bossTapHint: number;
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
  weaponName,
  elapsed,
  hasChangedLane,
  bossTapHint,
}: HUDProps) {
  const hintOpacity = swipeHintOpacity(elapsed, hasChangedLane);
  const tapHint = Math.max(0, Math.min(1, bossTapHint));

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.top}>
        <View style={styles.army}>
          <View style={styles.armyIcon}>
            <View style={styles.soldierHelmet} />
            <View style={styles.soldierBrim} />
            <View style={styles.soldierHead} />
            <View style={styles.soldierTorso} />
            <View style={styles.soldierArm} />
            <View style={styles.soldierGun} />
            <View style={styles.soldierBarrel} />
            <View style={styles.soldierLegLeft} />
            <View style={styles.soldierLegRight} />
          </View>
          <Text style={styles.armyCount}>{Math.max(0, Math.floor(armySize))}</Text>
        </View>
        <Text style={styles.distance}>{formatDistance(distance)}</Text>
        <View style={styles.weaponWrap}>
          <View style={styles.weaponIcon}>
            <View style={styles.weaponBarrel} />
            <View style={styles.weaponBody} />
          </View>
          <Text style={styles.weaponName}>{weaponName}</Text>
        </View>
      </View>
      {hintOpacity > 0.02 ? (
        <Text style={[styles.hint, { opacity: hintOpacity }]}>←  SWIPE  →</Text>
      ) : null}
      {tapHint > 0.02 ? (
        <Text style={[styles.tapHint, { opacity: tapHint }]}>TAP FAST!</Text>
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
    width: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  armyIcon: {
    width: 22,
    height: 26,
  },
  soldierHelmet: {
    position: 'absolute',
    top: 0,
    left: 3,
    width: 12,
    height: 7,
    borderRadius: 6,
    backgroundColor: PALETTE.soldierHelmet,
  },
  soldierBrim: {
    position: 'absolute',
    top: 5,
    left: 2,
    width: 14,
    height: 2.5,
    borderRadius: 1,
    backgroundColor: PALETTE.soldierHelmet,
  },
  soldierHead: {
    position: 'absolute',
    top: 6,
    left: 5,
    width: 8,
    height: 7,
    borderRadius: 4,
    backgroundColor: PALETTE.soldierSkin,
  },
  soldierTorso: {
    position: 'absolute',
    top: 12,
    left: 4,
    width: 10,
    height: 8,
    borderRadius: 2,
    backgroundColor: PALETTE.soldierUniform,
  },
  soldierArm: {
    position: 'absolute',
    top: 13,
    left: 12,
    width: 4,
    height: 5,
    borderRadius: 1,
    backgroundColor: PALETTE.soldierUniformDark,
  },
  soldierGun: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 3,
    height: 6,
    borderRadius: 1,
    backgroundColor: PALETTE.soldierGun,
  },
  soldierBarrel: {
    position: 'absolute',
    top: 13,
    left: 16,
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: PALETTE.soldierGunMetal,
  },
  soldierLegLeft: {
    position: 'absolute',
    top: 19,
    left: 5,
    width: 3.5,
    height: 7,
    borderRadius: 1,
    backgroundColor: PALETTE.soldierPants,
  },
  soldierLegRight: {
    position: 'absolute',
    top: 19,
    left: 10,
    width: 3.5,
    height: 7,
    borderRadius: 1,
    backgroundColor: PALETTE.soldierPants,
  },
  armyCount: {
    color: PALETTE.hudText,
    fontSize: 20,
    fontWeight: '800',
    textShadowColor: 'rgba(20,40,10,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  weaponWrap: {
    width: 88,
    alignItems: 'flex-end',
    gap: 2,
  },
  weaponIcon: {
    width: 22,
    height: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  weaponBarrel: {
    position: 'absolute',
    top: 0,
    width: 14,
    height: 5,
    borderRadius: 2,
    backgroundColor: PALETTE.weaponMetal,
  },
  weaponBody: {
    width: 12,
    height: 10,
    borderRadius: 2,
    backgroundColor: PALETTE.weaponCrate,
  },
  weaponName: {
    color: PALETTE.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'right',
    textShadowColor: 'rgba(20,40,10,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  tapHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '31%',
    textAlign: 'center',
    color: PALETTE.accent,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2.4,
    textShadowColor: 'rgba(20,40,10,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});
