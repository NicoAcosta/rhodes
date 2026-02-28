import { EffectsChain } from "./effects";
import { Voice } from "./voice";
import { VoicePool, type VoiceFactory } from "./voice-pool";

/**
 * Top-level audio engine. Manages AudioContext, voices, and effects.
 *
 * Usage:
 *   const engine = new AudioEngine();
 *   await engine.init();
 *   engine.noteOn(60);  // play middle C
 *   engine.noteOff(60); // release
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private effects: EffectsChain | null = null;
  private pool: VoicePool;
  private factory: VoiceFactory;

  constructor(factory?: VoiceFactory) {
    this.pool = new VoicePool(12);
    this.factory =
      factory ??
      ((ctx, midi, dest, velocity?) => new Voice(ctx, midi, dest, undefined, velocity));
  }

  /** Initialize or resume the AudioContext. Must be called from a user gesture. */
  async init(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.effects = new EffectsChain(this.ctx);
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  get isReady(): boolean {
    return this.ctx !== null && this.ctx.state === "running";
  }

  noteOn(midi: number, velocity?: number): void {
    if (!this.ctx || !this.effects) return;
    if (this.pool.has(midi)) return; // Already playing

    const voice = this.factory(this.ctx, midi, this.effects.input, velocity);
    this.pool.add(voice);
  }

  noteOff(midi: number): void {
    this.pool.release(midi);
  }

  releaseAll(): void {
    this.pool.releaseAll();
  }

  setVolume(value: number): void {
    this.effects?.setVolume(value);
  }

  setTremoloRate(hz: number): void {
    this.effects?.setTremoloRate(hz);
  }

  setTremoloDepth(depth: number): void {
    this.effects?.setTremoloDepth(depth);
  }

  setTone(value: number): void {
    this.effects?.setTone(value);
  }

  setChorusMix(value: number): void {
    this.effects?.setChorusMix(value);
  }

  dispose(): void {
    this.pool.releaseAll();
    this.effects?.dispose();
    this.ctx?.close();
    this.ctx = null;
    this.effects = null;
  }
}
