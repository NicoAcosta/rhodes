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
 *   [Modulator Osc] → [Mod Gain (3-stage envelope)] → carrier.frequency
 *   [Carrier Osc]   → [Amp Gain (register-dependent ADSR)] → output
 *   [Bell Osc]      → [Bell Gain (fast decay)]              → output
 *
 * Register-dependent: bass = less mod (warmer), treble = more mod (brighter).
 * Velocity-sensitive: controls amplitude, FM brightness, and bell level.
 */
export class Voice implements IVoice {
  readonly midi: number;

  private carrier: OscillatorNode;
  private modulator: OscillatorNode;
  private modGain: GainNode;
  private ampGain: GainNode;
  private bellOsc: OscillatorNode;
  private bellGain: GainNode;
  private released = false;
  private disposed = false;

  constructor(
    private ctx: AudioContext,
    midi: number,
    destination: AudioNode,
    time?: number,
    velocity?: number
  ) {
    this.midi = midi;
    const now = time ?? ctx.currentTime;
    const freq = midiToFrequency(midi);

    // Velocity curve (quadratic for natural feel)
    const vel = (velocity ?? 100) / 127;
    const velCurve = vel * vel;

    // Register-dependent modulation: higher notes get more brightness
    const normalizedNote = (midi - 24) / 72; // 0..1 across playable range
    let modIndex = 80 + normalizedNote * 200; // 80–280 mod depth
    const modDecay = 0.15 + (1 - normalizedNote) * 0.25; // bass sustains mod longer

    // Velocity scales mod index: 40% at soft → 100% at hard
    modIndex *= 0.4 + velCurve * 0.6;

    // --- Carrier oscillator ---
    this.carrier = ctx.createOscillator();
    this.carrier.type = "sine";
    this.carrier.frequency.setValueAtTime(freq, now);

    // --- Modulator oscillator (1:1 ratio for classic Rhodes) ---
    this.modulator = ctx.createOscillator();
    this.modulator.type = "sine";
    this.modulator.frequency.setValueAtTime(freq, now);

    // --- Modulation gain: 3-stage envelope ---
    this.modGain = ctx.createGain();
    // Stage 1: Initial burst overshoot (~5ms)
    this.modGain.gain.setValueAtTime(modIndex * 1.2, now);
    this.modGain.gain.exponentialRampToValueAtTime(modIndex, now + 0.005);
    // Stage 2: Fast decay to mid level
    this.modGain.gain.exponentialRampToValueAtTime(
      modIndex * 0.25,
      now + modDecay * 0.4
    );
    // Stage 3: Slow tail to low sustain
    this.modGain.gain.exponentialRampToValueAtTime(
      modIndex * 0.08,
      now + modDecay * 2
    );

    // Connect modulator → carrier frequency
    this.modulator.connect(this.modGain);
    this.modGain.connect(this.carrier.frequency);

    // --- Amplitude envelope (register-dependent) ---
    // Amplitude peak: 0.10 (soft) → 0.40 (hard)
    const peakLevel = 0.1 + velCurve * 0.3;
    // Register-dependent decay: 0.3s treble → 1.1s bass
    const ampDecay = 0.3 + (1 - normalizedNote) * 0.8;
    // Register-dependent sustain: 0.08 treble → 0.20 bass
    const sustainLevel = 0.08 + (1 - normalizedNote) * 0.12;

    this.ampGain = ctx.createGain();
    this.ampGain.gain.setValueAtTime(0, now);
    // Attack: fast (~0.5ms)
    this.ampGain.gain.linearRampToValueAtTime(peakLevel, now + 0.0005);
    // Decay to sustain
    this.ampGain.gain.exponentialRampToValueAtTime(sustainLevel, now + ampDecay);

    // Connect carrier → amp → destination
    this.carrier.connect(this.ampGain);
    this.ampGain.connect(destination);

    // --- Bell/tine operator (parallel to carrier) ---
    // Slightly inharmonic 3:1 ratio like real tines
    this.bellOsc = ctx.createOscillator();
    this.bellOsc.type = "sine";
    this.bellOsc.frequency.setValueAtTime(freq * 2.997, now);

    // Bell level: register-dependent (treble has more bell), velocity-scaled
    let bellLevel = 0.08 + normalizedNote * 0.2;
    bellLevel *= velCurve;
    const bellDecay = 0.08 + (1 - normalizedNote) * 0.15; // 80–230ms

    this.bellGain = ctx.createGain();
    this.bellGain.gain.setValueAtTime(bellLevel, now);
    this.bellGain.gain.exponentialRampToValueAtTime(0.001, now + bellDecay);

    // Connect bell → bellGain → destination
    this.bellOsc.connect(this.bellGain);
    this.bellGain.connect(destination);

    // Start all oscillators
    this.carrier.start(now);
    this.modulator.start(now);
    this.bellOsc.start(now);
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

    // Fade bell
    this.bellGain.gain.cancelScheduledValues(now);
    this.bellGain.gain.setValueAtTime(this.bellGain.gain.value, now);
    this.bellGain.gain.exponentialRampToValueAtTime(0.001, now + release);

    // Auto-dispose after release
    setTimeout(() => this.dispose(), release * 1000 + 50);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    try {
      this.carrier.stop();
      this.modulator.stop();
      this.bellOsc.stop();
      this.carrier.disconnect();
      this.modulator.disconnect();
      this.bellOsc.disconnect();
      this.modGain.disconnect();
      this.ampGain.disconnect();
      this.bellGain.disconnect();
    } catch {
      // Already stopped/disconnected
    }
  }
}
