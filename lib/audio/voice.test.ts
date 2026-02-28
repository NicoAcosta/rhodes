import { describe, expect, it, vi, beforeEach } from "vitest";
import { Voice } from "./voice";

// --- Web Audio API mocks ---

function mockParam(initial = 0) {
  const calls: { method: string; args: unknown[] }[] = [];
  return {
    value: initial,
    calls,
    setValueAtTime: vi.fn((v: number, t: number) => {
      calls.push({ method: "setValueAtTime", args: [v, t] });
    }),
    linearRampToValueAtTime: vi.fn((v: number, t: number) => {
      calls.push({ method: "linearRampToValueAtTime", args: [v, t] });
    }),
    exponentialRampToValueAtTime: vi.fn((v: number, t: number) => {
      calls.push({ method: "exponentialRampToValueAtTime", args: [v, t] });
    }),
    setTargetAtTime: vi.fn((v: number, t: number, tc: number) => {
      calls.push({ method: "setTargetAtTime", args: [v, t, tc] });
    }),
    cancelScheduledValues: vi.fn((t: number) => {
      calls.push({ method: "cancelScheduledValues", args: [t] });
    }),
  };
}

function mockOscillator() {
  return {
    type: "sine" as OscillatorType,
    frequency: mockParam(440),
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function mockGain() {
  return {
    gain: mockParam(0),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function createMockContext(time = 0) {
  const oscillators: ReturnType<typeof mockOscillator>[] = [];
  const gains: ReturnType<typeof mockGain>[] = [];

  const ctx = {
    currentTime: time,
    createOscillator: vi.fn(() => {
      const osc = mockOscillator();
      oscillators.push(osc);
      return osc;
    }),
    createGain: vi.fn(() => {
      const g = mockGain();
      gains.push(g);
      return g;
    }),
    oscillators,
    gains,
  } as unknown as AudioContext & {
    oscillators: ReturnType<typeof mockOscillator>[];
    gains: ReturnType<typeof mockGain>[];
  };

  return ctx;
}

describe("Voice", () => {
  let ctx: ReturnType<typeof createMockContext>;
  const dest = { connect: vi.fn() } as unknown as AudioNode;

  beforeEach(() => {
    ctx = createMockContext(1.0);
    vi.useFakeTimers();
  });

  describe("Step 1: Refined FM envelope shaping", () => {
    it("creates 3 oscillators (carrier, modulator, bell)", () => {
      new Voice(ctx, 60, dest);
      // carrier + modulator + bell = 3
      expect(ctx.createOscillator).toHaveBeenCalledTimes(3);
    });

    it("creates 3 gain nodes (modGain, ampGain, bellGain)", () => {
      new Voice(ctx, 60, dest);
      // modGain + ampGain + bellGain = 3
      expect(ctx.createGain).toHaveBeenCalledTimes(3);
    });

    it("uses 3-stage mod envelope with initial overshoot", () => {
      new Voice(ctx, 60, dest);
      // modGain is the first gain created (index 0)
      const modGainCalls = ctx.gains[0].gain.calls;

      // Stage 1: Initial burst overshoot
      expect(modGainCalls[0].method).toBe("setValueAtTime");
      const initialValue = modGainCalls[0].args[0] as number;

      // Stage 1 ramp: overshoot decays to base modIndex
      expect(modGainCalls[1].method).toBe("exponentialRampToValueAtTime");
      const baseModIndex = modGainCalls[1].args[0] as number;
      expect(initialValue).toBeGreaterThan(baseModIndex); // overshoot > base

      // Stage 2: Fast decay to mid level
      expect(modGainCalls[2].method).toBe("exponentialRampToValueAtTime");
      const midLevel = modGainCalls[2].args[0] as number;
      expect(midLevel).toBeLessThan(baseModIndex);

      // Stage 3: Slow tail to low sustain
      expect(modGainCalls[3].method).toBe("exponentialRampToValueAtTime");
      const sustainLevel = modGainCalls[3].args[0] as number;
      expect(sustainLevel).toBeLessThan(midLevel);
    });

    it("has fast amplitude attack (~0.5ms)", () => {
      new Voice(ctx, 60, dest);
      // ampGain is the second gain created (index 1)
      const ampCalls = ctx.gains[1].gain.calls;

      // First: setValueAtTime(0, now)
      expect(ampCalls[0].method).toBe("setValueAtTime");
      expect(ampCalls[0].args[0]).toBe(0);

      // Second: fast attack ramp
      expect(ampCalls[1].method).toBe("linearRampToValueAtTime");
      const attackTime = (ampCalls[1].args[1] as number) - 1.0; // relative to now=1.0
      expect(attackTime).toBeLessThanOrEqual(0.001); // ≤ 1ms
    });

    it("uses register-dependent amplitude decay (treble faster than bass)", () => {
      new Voice(ctx, 36, dest); // bass note
      const bassDecayTime = ctx.gains[1].gain.calls[2].args[1] as number;

      ctx = createMockContext(1.0);
      new Voice(ctx, 84, dest); // treble note
      const trebleDecayTime = ctx.gains[1].gain.calls[2].args[1] as number;

      // Bass should have longer decay than treble (higher absolute time = later end)
      const bassDecay = bassDecayTime - 1.0;
      const trebleDecay = trebleDecayTime - 1.0;
      expect(bassDecay).toBeGreaterThan(trebleDecay);
    });

    it("uses register-dependent sustain level (treble lower than bass)", () => {
      new Voice(ctx, 36, dest); // bass
      const bassSustain = ctx.gains[1].gain.calls[2].args[0] as number;

      ctx = createMockContext(1.0);
      new Voice(ctx, 84, dest); // treble
      const trebleSustain = ctx.gains[1].gain.calls[2].args[0] as number;

      expect(bassSustain).toBeGreaterThan(trebleSustain);
    });
  });

  describe("Step 2: Bell/tine operator", () => {
    it("sets bell oscillator frequency to ~3x carrier frequency", () => {
      new Voice(ctx, 60, dest);
      // Bell osc is the 3rd oscillator (index 2)
      const bellFreqCalls = ctx.oscillators[2].frequency.calls;
      const bellFreq = bellFreqCalls[0].args[0] as number;
      const carrierFreq = ctx.oscillators[0].frequency.calls[0].args[0] as number;

      expect(bellFreq / carrierFreq).toBeCloseTo(2.997, 2);
    });

    it("bell has register-dependent level (treble has more bell)", () => {
      new Voice(ctx, 36, dest); // bass
      const bassBellLevel = ctx.gains[2].gain.calls[0].args[0] as number;

      ctx = createMockContext(1.0);
      new Voice(ctx, 84, dest); // treble
      const trebleBellLevel = ctx.gains[2].gain.calls[0].args[0] as number;

      expect(trebleBellLevel).toBeGreaterThan(bassBellLevel);
    });

    it("bell has fast decay envelope", () => {
      new Voice(ctx, 60, dest);
      const bellGainCalls = ctx.gains[2].gain.calls;

      // Initial level set
      expect(bellGainCalls[0].method).toBe("setValueAtTime");
      // Fast decay to near-zero
      expect(bellGainCalls[1].method).toBe("exponentialRampToValueAtTime");
      const decayTarget = bellGainCalls[1].args[0] as number;
      expect(decayTarget).toBeLessThanOrEqual(0.001);

      // Decay time should be < 300ms
      const decayTime = (bellGainCalls[1].args[1] as number) - 1.0;
      expect(decayTime).toBeLessThan(0.3);
    });

    it("connects bell osc → bellGain → destination", () => {
      new Voice(ctx, 60, dest);
      const bellOsc = ctx.oscillators[2];
      const bellGain = ctx.gains[2];

      expect(bellOsc.connect).toHaveBeenCalledWith(bellGain);
      expect(bellGain.connect).toHaveBeenCalledWith(dest);
    });

    it("starts bell oscillator", () => {
      new Voice(ctx, 60, dest);
      expect(ctx.oscillators[2].start).toHaveBeenCalled();
    });
  });

  describe("Step 3: Velocity sensitivity", () => {
    it("defaults to velocity 100 when not provided", () => {
      new Voice(ctx, 60, dest);
      const ampLevel1 = ctx.gains[1].gain.calls[1].args[0] as number;

      ctx = createMockContext(1.0);
      new Voice(ctx, 60, dest, undefined, 100);
      const ampLevel2 = ctx.gains[1].gain.calls[1].args[0] as number;

      expect(ampLevel1).toBeCloseTo(ampLevel2, 5);
    });

    it("soft velocity produces lower amplitude than hard", () => {
      new Voice(ctx, 60, dest, undefined, 40); // soft
      const softAmp = ctx.gains[1].gain.calls[1].args[0] as number;

      ctx = createMockContext(1.0);
      new Voice(ctx, 60, dest, undefined, 120); // hard
      const hardAmp = ctx.gains[1].gain.calls[1].args[0] as number;

      expect(hardAmp).toBeGreaterThan(softAmp);
    });

    it("soft velocity produces less FM modulation than hard", () => {
      new Voice(ctx, 60, dest, undefined, 40);
      const softMod = ctx.gains[0].gain.calls[1].args[0] as number; // base modIndex after overshoot

      ctx = createMockContext(1.0);
      new Voice(ctx, 60, dest, undefined, 120);
      const hardMod = ctx.gains[0].gain.calls[1].args[0] as number;

      expect(hardMod).toBeGreaterThan(softMod);
    });

    it("soft velocity produces less bell than hard", () => {
      new Voice(ctx, 60, dest, undefined, 40);
      const softBell = ctx.gains[2].gain.calls[0].args[0] as number;

      ctx = createMockContext(1.0);
      new Voice(ctx, 60, dest, undefined, 120);
      const hardBell = ctx.gains[2].gain.calls[0].args[0] as number;

      expect(hardBell).toBeGreaterThan(softBell);
    });
  });

  describe("release and dispose", () => {
    it("release fades out all gains and stops after timeout", () => {
      const voice = new Voice(ctx, 60, dest);
      voice.release();

      // amp, mod, and bell gains should have cancelScheduledValues + fade
      // At minimum ampGain, modGain, and bellGain get cancelled
      expect(ctx.gains[0].gain.cancelScheduledValues).toHaveBeenCalled(); // mod
      expect(ctx.gains[1].gain.cancelScheduledValues).toHaveBeenCalled(); // amp
      expect(ctx.gains[2].gain.cancelScheduledValues).toHaveBeenCalled(); // bell
    });

    it("dispose stops and disconnects all oscillators", () => {
      const voice = new Voice(ctx, 60, dest);
      voice.dispose();

      for (const osc of ctx.oscillators) {
        expect(osc.stop).toHaveBeenCalled();
        expect(osc.disconnect).toHaveBeenCalled();
      }
      for (const gain of ctx.gains) {
        expect(gain.disconnect).toHaveBeenCalled();
      }
    });

    it("release is idempotent", () => {
      const voice = new Voice(ctx, 60, dest);
      voice.release();
      voice.release();
      // Should not throw or double-schedule
      expect(ctx.gains[1].gain.cancelScheduledValues).toHaveBeenCalledTimes(1);
    });

    it("dispose is idempotent", () => {
      const voice = new Voice(ctx, 60, dest);
      voice.dispose();
      voice.dispose();
      // Each oscillator stopped only once
      for (const osc of ctx.oscillators) {
        expect(osc.stop).toHaveBeenCalledTimes(1);
      }
    });
  });
});
