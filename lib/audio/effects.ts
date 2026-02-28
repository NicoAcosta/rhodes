/**
 * Global effects chain for the Rhodes engine.
 *
 * Signal flow:
 *   voices → [BiquadFilter (tone EQ)] → [Gain (tremolo)] → chorus → [Gain (master volume)] → output
 *
 * Chorus (stereo):
 *   tremolo → dry gain (center) ──────────────────────────┐
 *   tremolo → DelayNode L (~7ms) → wet gain L ────────────├→ merger → master
 *   tremolo → DelayNode R (~9ms) → wet gain R ────────────┘
 *                ↑                      ↑
 *           LFO-L (0.8Hz)         LFO-R (1.1Hz)
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

  // Chorus nodes
  private chorusDelayL: DelayNode;
  private chorusDelayR: DelayNode;
  private chorusLfoL: OscillatorNode;
  private chorusLfoR: OscillatorNode;
  private chorusLfoGainL: GainNode;
  private chorusLfoGainR: GainNode;
  private chorusWetL: GainNode;
  private chorusWetR: GainNode;
  private chorusDry: GainNode;
  private chorusMerger: ChannelMergerNode;

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

    // --- Stereo chorus ---

    // Delay lines with different base times
    this.chorusDelayL = ctx.createDelay(0.05);
    this.chorusDelayL.delayTime.setValueAtTime(0.007, ctx.currentTime);

    this.chorusDelayR = ctx.createDelay(0.05);
    this.chorusDelayR.delayTime.setValueAtTime(0.009, ctx.currentTime);

    // Chorus LFOs (different rates for stereo movement)
    this.chorusLfoL = ctx.createOscillator();
    this.chorusLfoL.type = "sine";
    this.chorusLfoL.frequency.setValueAtTime(0.8, ctx.currentTime);

    this.chorusLfoR = ctx.createOscillator();
    this.chorusLfoR.type = "sine";
    this.chorusLfoR.frequency.setValueAtTime(1.1, ctx.currentTime);

    // LFO depth: ±2ms sweep
    this.chorusLfoGainL = ctx.createGain();
    this.chorusLfoGainL.gain.setValueAtTime(0.002, ctx.currentTime);

    this.chorusLfoGainR = ctx.createGain();
    this.chorusLfoGainR.gain.setValueAtTime(0.002, ctx.currentTime);

    // Connect LFOs to delay time modulation
    this.chorusLfoL.connect(this.chorusLfoGainL);
    this.chorusLfoGainL.connect(this.chorusDelayL.delayTime);

    this.chorusLfoR.connect(this.chorusLfoGainR);
    this.chorusLfoGainR.connect(this.chorusDelayR.delayTime);

    this.chorusLfoL.start();
    this.chorusLfoR.start();

    // Wet gains (L and R)
    this.chorusWetL = ctx.createGain();
    this.chorusWetL.gain.setValueAtTime(0, ctx.currentTime); // mix starts at 0

    this.chorusWetR = ctx.createGain();
    this.chorusWetR.gain.setValueAtTime(0, ctx.currentTime);

    // Dry gain
    this.chorusDry = ctx.createGain();
    this.chorusDry.gain.setValueAtTime(1, ctx.currentTime);

    // Channel merger for stereo (2 inputs → stereo output)
    this.chorusMerger = ctx.createChannelMerger(2);

    // Connect chorus signal path
    // tremolo → delay L → wet L → merger (left channel)
    this.tremoloGain.connect(this.chorusDelayL);
    this.chorusDelayL.connect(this.chorusWetL);
    this.chorusWetL.connect(this.chorusMerger, 0, 0);

    // tremolo → delay R → wet R → merger (right channel)
    this.tremoloGain.connect(this.chorusDelayR);
    this.chorusDelayR.connect(this.chorusWetR);
    this.chorusWetR.connect(this.chorusMerger, 0, 1);

    // tremolo → dry → merger (both channels for center)
    this.tremoloGain.connect(this.chorusDry);
    this.chorusDry.connect(this.chorusMerger, 0, 0);
    this.chorusDry.connect(this.chorusMerger, 0, 1);

    // Master volume
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, ctx.currentTime);

    // Chain: input → filter → tremolo → chorus → master → destination
    this.input.connect(this.filter);
    this.filter.connect(this.tremoloGain);
    this.chorusMerger.connect(this.masterGain);
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

  /** Set chorus mix (0–1). 0 = dry/bypass, 1 = full wet stereo chorus. */
  setChorusMix(value: number): void {
    const now = this.ctx.currentTime;
    // Wet gains scale with mix
    this.chorusWetL.gain.setTargetAtTime(value * 0.5, now, 0.01);
    this.chorusWetR.gain.setTargetAtTime(value * 0.5, now, 0.01);
    // Dry scales inversely (1 when dry, 0.5 when full wet for balance)
    this.chorusDry.gain.setTargetAtTime(1 - value * 0.5, now, 0.01);
  }

  dispose(): void {
    try {
      this.lfo.stop();
      this.chorusLfoL.stop();
      this.chorusLfoR.stop();
      this.lfo.disconnect();
      this.lfoGain.disconnect();
      this.input.disconnect();
      this.filter.disconnect();
      this.tremoloGain.disconnect();
      this.chorusDelayL.disconnect();
      this.chorusDelayR.disconnect();
      this.chorusLfoL.disconnect();
      this.chorusLfoR.disconnect();
      this.chorusLfoGainL.disconnect();
      this.chorusLfoGainR.disconnect();
      this.chorusWetL.disconnect();
      this.chorusWetR.disconnect();
      this.chorusDry.disconnect();
      this.chorusMerger.disconnect();
      this.masterGain.disconnect();
    } catch {
      // Already stopped/disconnected
    }
  }
}
