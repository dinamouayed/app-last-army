import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';

import type { WeaponId } from '../game/config/weapons';

export type SoundId =
  | WeaponId
  | 'slam'
  | 'explosion'
  | 'bossDeath';

const SOURCES: Record<SoundId, number> = {
  pistol: require('../../assets/sfx/pistol.wav'),
  smg: require('../../assets/sfx/smg.wav'),
  shotgun: require('../../assets/sfx/shotgun.wav'),
  machineGun: require('../../assets/sfx/machine-gun.wav'),
  slam: require('../../assets/sfx/slam.wav'),
  explosion: require('../../assets/sfx/explosion.wav'),
  bossDeath: require('../../assets/sfx/boss-death.wav'),
};

const POOL_SIZE: Record<SoundId, number> = {
  pistol: 2,
  smg: 3,
  shotgun: 2,
  machineGun: 3,
  slam: 1,
  explosion: 1,
  bossDeath: 1,
};

const VOLUME: Record<SoundId, number> = {
  pistol: 0.85,
  smg: 0.62,
  shotgun: 0.95,
  machineGun: 0.68,
  slam: 0.95,
  explosion: 0.96,
  bossDeath: 1,
};

const MIN_GAP: Record<SoundId, number> = {
  pistol: 0.04,
  smg: 0.05,
  shotgun: 0.1,
  machineGun: 0.045,
  slam: 0.18,
  explosion: 0.22,
  bossDeath: 0.5,
};

const pools: Partial<Record<SoundId, AudioPlayer[]>> = {};
const cursors: Partial<Record<SoundId, number>> = {};
const lastPlayedAt: Partial<Record<SoundId, number>> = {};
let ready = false;

export async function initGameAudio(): Promise<void> {
  if (ready) {
    return;
  }
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsRecording: false,
      interruptionMode: 'mixWithOthers',
    });
    (Object.keys(SOURCES) as SoundId[]).forEach((id) => {
      const size = POOL_SIZE[id];
      const players: AudioPlayer[] = [];
      for (let i = 0; i < size; i += 1) {
        const player = createAudioPlayer(SOURCES[id], { updateInterval: 10_000 });
        player.volume = VOLUME[id];
        players.push(player);
      }
      pools[id] = players;
      cursors[id] = 0;
    });
    ready = true;
  } catch (error) {
    console.warn('[GameAudio] init failed', error);
  }
}

export function playSound(id: SoundId, volumeScale = 1): void {
  if (!ready) {
    return;
  }
  const now = Date.now();
  const last = lastPlayedAt[id] ?? 0;
  if (now - last < MIN_GAP[id] * 1000) {
    return;
  }
  lastPlayedAt[id] = now;

  const pool = pools[id];
  if (!pool || pool.length === 0) {
    return;
  }
  const cursor = cursors[id] ?? 0;
  const player = pool[cursor];
  cursors[id] = (cursor + 1) % pool.length;
  if (!player) {
    return;
  }
  if (volumeScale !== 1) {
    try {
      player.volume = Math.max(0, Math.min(1, VOLUME[id] * volumeScale));
    } catch {
      // Volume setter can be native-only.
    }
  }
  const start = () => {
    try {
      player.play();
    } catch {
      // Native audio must never throw into the game loop.
    }
  };
  try {
    void player.seekTo(0).then(start, start);
  } catch {
    start();
  }
}

export function disposeGameAudio(): void {
  (Object.keys(pools) as SoundId[]).forEach((id) => {
    const pool = pools[id];
    if (!pool) {
      return;
    }
    for (let i = 0; i < pool.length; i += 1) {
      try {
        pool[i]?.remove();
      } catch {
        // Player already released.
      }
    }
    pools[id] = [];
  });
  Object.keys(lastPlayedAt).forEach((id) => {
    lastPlayedAt[id as SoundId] = 0;
  });
  ready = false;
}
