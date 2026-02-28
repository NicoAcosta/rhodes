import { midiToFrequency } from "@/lib/music/notes";

export interface IVoice {
  readonly midi: number;
  release(): void;
  dispose(): void;
}

/**
 * FM synthesis voice for a single Rhodes note.
 *
 * Signal chain:
 *   [Modulator Osc] → [Mod Gain (envelope)] → carrier.frequency
 *   [Carrier Osc]   → [Amp Gain (ADSR)]     → output
 *
 * Register-dependent: bass = less mod (warmer), treble = more mod (brighter).
 */
export class Voice implements IVoice {
  readonly midi: number;

  private carrier: OscillatorNode;
  private modulator: OscillatorNode;
  private modGain: GainNode;
  private ampGain: GainNode;
  private released = false;
  private disposed = false;

  constructor(
    private ctx: AudioContext,
    midi: number,
    destination: AudioNode,
    time?: number
  ) {
    this.midi = midi;
    const now = time ?? ctx.currentTime;
    const freq = midiToFrequency(midi);

    // Register-dependent modulation: higher notes get more brightness
    const normalizedNote = (midi - 24) / 72; // 0..1 across playable range
    const modIndex = 80 + normalizedNote * 200; // 80–280 mod depth
    const modDecay = 0.15 + (1 - normalizedNote) * 0.25; // bass sustains mod longer

    // Carrier oscillator
    this.carrier = ctx.createOscillator();
    this.carrier.type = "sine";
    this.carrier.frequency.setValueAtTime(freq, now);

    // Modulator oscillator (1:1 ratio for classic Rhodes)
    this.modulator = ctx.createOscillator();
    this.modulator.type = "sine";
    this.modulator.frequency.setValueAtTime(freq, now);

    // Modulation gain (controls mod depth with envelope)
    this.modGain = ctx.createGain();
    // Mod envelope: high attack (tine strike) → fast decay → low sustain
    this.modGain.gain.setValueAtTime(modIndex, now);
    this.modGain.gain.exponentialRampToValueAtTime(
      modIndex * 0.15,
      now + modDecay
    );

    // Connect modulator → carrier frequency
    this.modulator.connect(this.modGain);
    this.modGain.connect(this.carrier.frequency);

    // Amplitude envelope
    this.ampGain = ctx.createGain();
    this.ampGain.gain.setValueAtTime(0, now);
    // Attack: fast (~2ms)
    this.ampGain.gain.linearRampToValueAtTime(0.35, now + 0.002);
    // Decay to sustain: ~0.8s
    this.ampGain.gain.exponentialRampToValueAtTime(0.15, now + 0.8);

    // Connect carrier → amp → destination
    this.carrier.connect(this.ampGain);
    this.ampGain.connect(destination);

    // Start oscillators
    this.carrier.start(now);
    this.modulator.start(now);
  }

  release(): void {
    if (this.released) return;
    this.released = true;

    const now = this.ctx.currentTime;
    const release = 0.5;

    // Cancel any scheduled ramps and release
    this.ampGain.gain.cancelScheduledValues(now);
    this.ampGain.gain.setValueAtTime(this.ampGain.gain.value, now);
    this.ampGain.gain.exponentialRampToValueAtTime(0.001, now + release);

    // Also fade mod to prevent clicks
    this.modGain.gain.cancelScheduledValues(now);
    this.modGain.gain.setValueAtTime(this.modGain.gain.value, now);
    this.modGain.gain.exponentialRampToValueAtTime(0.001, now + release);

    // Auto-dispose after release
    setTimeout(() => this.dispose(), release * 1000 + 50);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    try {
      this.carrier.stop();
      this.modulator.stop();
      this.carrier.disconnect();
      this.modulator.disconnect();
      this.modGain.disconnect();
      this.ampGain.disconnect();
    } catch {
      // Already stopped/disconnected
    }
  }
}
