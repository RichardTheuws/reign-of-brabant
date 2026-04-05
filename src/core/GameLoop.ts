const FIXED_TIMESTEP = 1 / 60;
const MAX_FRAME_TIME = 0.05;

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private rafId = 0;
  private tick = 0;

  private onFixedUpdate: (dt: number) => void;
  private onRender: (alpha: number) => void;

  constructor(
    onFixedUpdate: (dt: number) => void,
    onRender: (alpha: number) => void,
  ) {
    this.onFixedUpdate = onFixedUpdate;
    this.onRender = onRender;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  get isPaused(): boolean {
    return !this.running;
  }

  get currentTick(): number {
    return this.tick;
  }

  private loop = (now: number): void => {
    if (!this.running) return;

    let frameTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME;
    }

    this.accumulator += frameTime;

    while (this.accumulator >= FIXED_TIMESTEP) {
      this.onFixedUpdate(FIXED_TIMESTEP);
      this.accumulator -= FIXED_TIMESTEP;
      this.tick++;
    }

    const alpha = this.accumulator / FIXED_TIMESTEP;
    this.onRender(alpha);

    this.rafId = requestAnimationFrame(this.loop);
  };
}
