#!/usr/bin/env node
/**
 * Casual-game SFX for Last Army.
 *
 * Design notes (Angry Birds Journey, arcade gunfire, game-feel mixing):
 * - Avoid sharp transients and raw white noise — those read as "broken speaker".
 * - Layer a low punch (sine downsweep) with filtered brown noise.
 * - Mix for comfort, not loudness. Repeated auto-fire must stay bearable.
 * - Short tails, exponential decay, cosine attack so nothing clicks.
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sfx');

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cosineAttack(t, attack) {
  if (attack <= 0) {
    return 1;
  }
  if (t >= attack) {
    return 1;
  }
  if (t <= 0) {
    return 0;
  }
  return 0.5 - 0.5 * Math.cos((Math.PI * t) / attack);
}

function expDecay(t, attack, decay) {
  const a = cosineAttack(t, attack);
  if (t <= attack) {
    return a;
  }
  return Math.exp(-(t - attack) / Math.max(0.001, decay));
}

function sweep(t, start, end, tau) {
  const k = 1 - Math.exp(-t / Math.max(0.001, tau));
  return start + (end - start) * k;
}

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function triangle(freq, t) {
  const phase = (freq * t) % 1;
  return 4 * Math.abs(phase - 0.5) - 1;
}

function makeLowpass(cutoff) {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  let y = 0;
  return (x) => {
    y += alpha * (x - y);
    return y;
  };
}

function makeHighpass(cutoff) {
  const lp = makeLowpass(cutoff);
  return (x) => x - lp(x);
}

function makeBrown(rng) {
  let brown = 0;
  return () => {
    brown += (rng() * 2 - 1) * 0.06;
    brown *= 0.997;
    brown = clamp(brown, -1, 1);
    return brown;
  };
}

function render(seconds, seed, mixFn) {
  const count = Math.floor(SAMPLE_RATE * seconds);
  const rng = mulberry32(seed);
  const brown = makeBrown(rng);
  const samples = new Float64Array(count);
  const hp = makeHighpass(45);
  const fadeSamples = Math.floor(SAMPLE_RATE * 0.012);

  for (let i = 0; i < count; i += 1) {
    const t = i / SAMPLE_RATE;
    samples[i] = hp(mixFn(t, brown));
  }

  for (let i = 0; i < fadeSamples; i += 1) {
    const idx = count - 1 - i;
    if (idx < 0) {
      break;
    }
    samples[idx] *= i / fadeSamples;
  }

  let peak = 0.0001;
  let sumSq = 0;
  for (let i = 0; i < count; i += 1) {
    peak = Math.max(peak, Math.abs(samples[i]));
    sumSq += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sumSq / count);
  const peakGain = 0.78 / peak;
  const rmsGain = rms > 0.0001 ? 0.2 / rms : peakGain;
  const gain = Math.min(peakGain, rmsGain);

  const out = new Float64Array(count);
  for (let i = 0; i < count; i += 1) {
    out[i] = Math.tanh(samples[i] * gain * 1.08);
  }
  return out;
}

function writeWav(fileName, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = clamp(Math.round(samples[i] * 32767), -32767, 32767);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT_DIR, fileName), buffer);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const pistolLp = makeLowpass(1500);
writeWav(
  'pistol.wav',
  render(0.14, 1101, (t, brown) => {
    const body = sine(sweep(t, 168, 72, 0.055), t) * expDecay(t, 0.006, 0.055);
    const thump = sine(sweep(t, 92, 48, 0.07), t) * expDecay(t, 0.008, 0.07);
    const puff = pistolLp(brown()) * expDecay(t, 0.005, 0.028);
    return body * 0.72 + thump * 0.55 + puff * 0.16;
  }),
);

const smgLp = makeLowpass(1300);
writeWav(
  'smg.wav',
  render(0.07, 2202, (t, brown) => {
    const body = sine(sweep(t, 210, 110, 0.028), t) * expDecay(t, 0.004, 0.024);
    const puff = smgLp(brown()) * expDecay(t, 0.003, 0.016);
    return body * 0.7 + puff * 0.14;
  }),
);

const shotgunLp = makeLowpass(820);
writeWav(
  'shotgun.wav',
  render(0.22, 3303, (t, brown) => {
    const boom = sine(sweep(t, 78, 34, 0.09), t) * expDecay(t, 0.008, 0.1);
    const sub = sine(sweep(t, 46, 24, 0.12), t) * expDecay(t, 0.01, 0.13);
    const spray = shotgunLp(brown()) * expDecay(t, 0.006, 0.055);
    return boom * 0.7 + sub * 0.62 + spray * 0.2;
  }),
);

const mgLp = makeLowpass(1150);
writeWav(
  'machine-gun.wav',
  render(0.08, 4404, (t, brown) => {
    const body = sine(sweep(t, 150, 78, 0.032), t) * expDecay(t, 0.005, 0.03);
    const weight = sine(sweep(t, 88, 50, 0.04), t) * expDecay(t, 0.006, 0.036);
    const puff = mgLp(brown()) * expDecay(t, 0.004, 0.018);
    return body * 0.62 + weight * 0.5 + puff * 0.15;
  }),
);

const slamLp = makeLowpass(620);
writeWav(
  'slam.wav',
  render(0.32, 5505, (t, brown) => {
    const thud = sine(sweep(t, 58, 28, 0.12), t) * expDecay(t, 0.012, 0.14);
    const whoom = slamLp(brown()) * expDecay(t, 0.01, 0.09);
    const flesh = triangle(sweep(t, 110, 55, 0.1), t) * expDecay(t, 0.014, 0.08) * 0.18;
    return thud * 0.85 + whoom * 0.28 + flesh;
  }),
);

const boomLp = makeLowpass(520);
writeWav(
  'explosion.wav',
  render(0.55, 6606, (t, brown) => {
    const rumble = sine(sweep(t, 52, 22, 0.22), t) * expDecay(t, 0.016, 0.22);
    const boom = sine(sweep(t, 84, 36, 0.16), t) * expDecay(t, 0.012, 0.16);
    const air = boomLp(brown()) * expDecay(t, 0.014, 0.18);
    return rumble * 0.8 + boom * 0.45 + air * 0.28;
  }),
);

const deathLp = makeLowpass(480);
writeWav(
  'boss-death.wav',
  render(0.95, 7707, (t, brown) => {
    const fall = sine(sweep(t, 96, 28, 0.38), t) * expDecay(t, 0.02, 0.38);
    const chest = sine(sweep(t, 64, 24, 0.42), t) * expDecay(t, 0.024, 0.42);
    const reward = sine(sweep(t, 196, 98, 0.35), t) * expDecay(t, 0.03, 0.28) * 0.16;
    const air = deathLp(brown()) * expDecay(t, 0.02, 0.28);
    return fall * 0.72 + chest * 0.7 + reward + air * 0.24;
  }),
);

console.log(`Wrote rounded casual SFX to ${OUT_DIR}`);
