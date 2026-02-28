/**
 * Global effects chain for the Rhodes engine.
 *
 * Signal flow:
 *   voices → [BiquadFilter (tone EQ)] → [Gain (tremolo)] → [Gain (master volume)] → output
 *
 * Tremolo: LFO (sine) modulates a gain node.
 * Tone: lowshelf BiquadFilter at 800Hz, gain -12 to +12 dB.
 */
export class EffectsChain {
  readonly input: GainNode;

  private filter: BiquadFilterNode;
  private tremoloGain: GainNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private masterGain: GainNode;

  constructor(private ctx: AudioContext) {
    // Input node (voices connect here)
    this.input = ctx.createGain();

    // Tone EQ: lowshelf at 800Hz
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowshelf";
    this.filter.frequency.setValueAtTime(800, ctx.currentTime);
    this.filter.gain.setValueAtTime(0, ctx.currentTime);

    // Tremolo: gain node modulated by LFO
    this.tremoloGain = ctx.createGain();
    this.tremoloGain.gain.setValueAtTime(1, ctx.currentTime);

    // LFO → lfoGain → tremoloGain.gain
    this.lfo = ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.setValueAtTime(0, ctx.currentTime);

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.setValueAtTime(0, ctx.currentTime);

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.tremoloGain.gain);
    this.lfo.start();

    // Master volume
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, ctx.currentTime);

    // Chain: input → filter → tremolo → master → destination
    this.input.connect(this.filter);
    this.filter.connect(this.tremoloGain);
    this.tremoloGain.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);
  }

  /** Set master volume (0–1). */
  setVolume(value: number): void {
    this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
  }

  /** Set tremolo rate in Hz (0–8). */
  setTremoloRate(hz: number): void {
    this.lfo.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.01);
  }

  /** Set tremolo depth (0–1). Maps to LFO gain amplitude. */
  setTremoloDepth(depth: number): void {
    // depth 0 = no modulation, depth 1 = full 0→1 swing
    this.lfoGain.gain.setTargetAtTime(depth * 0.5, this.ctx.currentTime, 0.01);
  }

  /** Set tone (0–1). 0 = warm (-12dB shelf), 0.5 = flat, 1 = bright (+12dB shelf). */
  setTone(value: number): void {
    const gain = (value - 0.5) * 24; // -12 to +12 dB
    this.filter.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.01);
  }

  dispose(): void {
    try {
      this.lfo.stop();
      this.lfo.disconnect();
      this.lfoGain.disconnect();
      this.input.disconnect();
      this.filter.disconnect();
      this.tremoloGain.disconnect();
      this.masterGain.disconnect();
    } catch {
      // Already stopped/disconnected
    }
  }
}
