import type { IVoice } from "@/lib/audio/voice";

/**
 * Sample-based voice for a single Rhodes note.
 *
 * Signal chain:
 *   AudioBufferSourceNode → GainNode (velocity-scaled) → destination
 *
 * The recorded sample already contains the authentic Rhodes transient,
 * so no additional envelope shaping is applied on attack.
 */
export class SampledVoice implements IVoice {
  readonly midi: number;

  private source: AudioBufferSourceNode;
  private gainNode: GainNode;
  private released = false;
  private disposed = false;

  constructor(
    private ctx: AudioContext,
    midi: number,
    destination: AudioNode,
    buffer: AudioBuffer,
    playbackRate: number,
    velocity?: number
  ) {
    this.midi = midi;
    const now = ctx.currentTime;

    // Velocity curve (quadratic for natural feel)
    const vel = (velocity ?? 100) / 127;
    const velCurve = vel * vel;
    const gain = 0.3 + velCurve * 0.7;

    // Gain node for velocity scaling
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(gain, now);

    // Buffer source with pitch-shifted playback
    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.playbackRate.setValueAtTime(playbackRate, now);

    // Connect: source → gain → destination
    this.source.connect(this.gainNode);
    this.gainNode.connect(destination);

    // Auto-dispose when sample ends naturally
    this.source.onended = () => this.dispose();

    this.source.start(now);
  }

  release(): void {
    if (this.released) return;
    this.released = true;

    const now = this.ctx.currentTime;
    const release = 0.5;

    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + release);

    // Auto-dispose after release
    setTimeout(() => this.dispose(), release * 1000 + 50);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    try {
      this.source.stop();
      this.source.disconnect();
      this.gainNode.disconnect();
    } catch {
      // Already stopped/disconnected
    }
  }
}
