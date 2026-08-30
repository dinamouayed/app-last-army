export type TickCallback = (dt: number) => void;

export interface FrameStats {
  fps: number;
  frames: number;
  elapsed: number;
}

export function createFrameStats(): FrameStats {
  return {
    fps: 60,
    frames: 0,
    elapsed: 0,
  };
}

export function updateFrameStats(stats: FrameStats, dt: number): void {
  stats.frames += 1;
  stats.elapsed += dt;
  if (stats.elapsed >= 0.5) {
    stats.fps = stats.frames / stats.elapsed;
    stats.frames = 0;
    stats.elapsed = 0;
  }
}

export function startGameLoop(
  onTick: TickCallback,
  maxDeltaSeconds: number,
): () => void {
  let frameId = 0;
  let lastTime = 0;
  let running = true;

  const frame = (now: number) => {
    if (!running) {
      return;
    }

    if (lastTime === 0) {
      lastTime = now;
    }

    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > maxDeltaSeconds) {
      dt = maxDeltaSeconds;
    }

    try {
      onTick(dt);
    } catch (error) {
      console.error('[GameLoop] tick failed', error);
    }
    if (running) {
      frameId = requestAnimationFrame(frame);
    }
  };

  frameId = requestAnimationFrame(frame);

  return () => {
    running = false;
    cancelAnimationFrame(frameId);
  };
}
