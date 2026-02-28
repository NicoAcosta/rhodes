import { describe, expect, it, vi, beforeEach } from "vitest";
import { EffectsChain } from "./effects";

// --- Web Audio API mocks ---

function mockParam(initial = 0) {
  return {
    value: initial,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

function mockOscillator() {
  return {
    type: "sine" as OscillatorType,
    frequency: mockParam(0),
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

function mockDelay() {
  return {
    delayTime: mockParam(0),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function mockFilter() {
  return {
    type: "lowshelf" as BiquadFilterType,
    frequency: mockParam(800),
    gain: mockParam(0),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function mockMerger() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function createMockContext() {
  const oscillators: ReturnType<typeof mockOscillator>[] = [];
  const gains: ReturnType<typeof mockGain>[] = [];
  const delays: ReturnType<typeof mockDelay>[] = [];
  const filters: ReturnType<typeof mockFilter>[] = [];
  const mergers: ReturnType<typeof mockMerger>[] = [];

  return {
    currentTime: 0,
    destination: { connect: vi.fn() },
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
    createDelay: vi.fn(() => {
      const d = mockDelay();
      delays.push(d);
      return d;
    }),
    createBiquadFilter: vi.fn(() => {
      const f = mockFilter();
      filters.push(f);
      return f;
    }),
    createChannelMerger: vi.fn(() => {
      const m = mockMerger();
      mergers.push(m);
      return m;
    }),
    oscillators,
    gains,
    delays,
    filters,
    mergers,
  } as unknown as AudioContext & {
    oscillators: ReturnType<typeof mockOscillator>[];
    gains: ReturnType<typeof mockGain>[];
    delays: ReturnType<typeof mockDelay>[];
    filters: ReturnType<typeof mockFilter>[];
    mergers: ReturnType<typeof mockMerger>[];
  };
}

describe("EffectsChain", () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("creates the chain with input node", () => {
    const fx = new EffectsChain(ctx);
    expect(fx.input).toBeDefined();
  });

  describe("stereo chorus", () => {
    it("creates two delay nodes for L/R channels", () => {
      new EffectsChain(ctx);
      expect(ctx.createDelay).toHaveBeenCalledTimes(2);
    });

    it("creates two LFO oscillators for chorus (plus tremolo LFO = 3 total)", () => {
      new EffectsChain(ctx);
      // 1 tremolo LFO + 2 chorus LFOs = 3
      expect(ctx.createOscillator).toHaveBeenCalledTimes(3);
    });

    it("creates a channel merger for stereo output", () => {
      new EffectsChain(ctx);
      expect(ctx.createChannelMerger).toHaveBeenCalledTimes(1);
    });

    it("sets different base delay times for L and R", () => {
      new EffectsChain(ctx);
      const delayL = ctx.delays[0].delayTime.setValueAtTime;
      const delayR = ctx.delays[1].delayTime.setValueAtTime;

      expect(delayL).toHaveBeenCalled();
      expect(delayR).toHaveBeenCalled();

      const timeL = delayL.mock.calls[0][0];
      const timeR = delayR.mock.calls[0][0];
      expect(timeL).not.toBe(timeR); // different delay times
      expect(timeL).toBeGreaterThan(0.005); // ~7ms
      expect(timeR).toBeGreaterThan(0.005); // ~9ms
    });

    it("sets different LFO rates for L and R chorus", () => {
      new EffectsChain(ctx);
      // Chorus LFOs are oscillators[1] and oscillators[2] (oscillators[0] is tremolo)
      const lfoL = ctx.oscillators[1].frequency.setValueAtTime;
      const lfoR = ctx.oscillators[2].frequency.setValueAtTime;

      const rateL = lfoL.mock.calls[0][0];
      const rateR = lfoR.mock.calls[0][0];
      expect(rateL).not.toBe(rateR);
      expect(rateL).toBeGreaterThan(0);
      expect(rateR).toBeGreaterThan(0);
    });

    it("starts with chorus mix at 0 (dry/bypass)", () => {
      new EffectsChain(ctx);
      // Wet gains initialized to 0 — find gains that were set to 0 at init
      // (multiple gains are 0 at init, including wet L and wet R)
      const zeroInits = ctx.gains.filter(
        (g) => g.gain.setValueAtTime.mock.calls.some((c: number[]) => c[0] === 0)
      );
      expect(zeroInits.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("setChorusMix", () => {
    it("scales wet gain when chorus mix is set", () => {
      const chain = new EffectsChain(ctx);
      chain.setChorusMix(0.5);

      // Verify wet gains received setTargetAtTime calls with non-zero values
      // Chorus wet gains are among the later gain nodes created
      const wetGainCalls = ctx.gains
        .flatMap((g) => g.gain.setTargetAtTime.mock.calls)
        .filter((call) => call[0] > 0);
      expect(wetGainCalls.length).toBeGreaterThan(0);
    });

    it("does not throw when setting mix to 0 or 1", () => {
      const fx = new EffectsChain(ctx);
      expect(() => fx.setChorusMix(0)).not.toThrow();
      expect(() => fx.setChorusMix(1)).not.toThrow();
    });
  });

  describe("existing controls still work", () => {
    it("setVolume does not throw", () => {
      const fx = new EffectsChain(ctx);
      expect(() => fx.setVolume(0.5)).not.toThrow();
    });

    it("setTremoloRate does not throw", () => {
      const fx = new EffectsChain(ctx);
      expect(() => fx.setTremoloRate(4)).not.toThrow();
    });

    it("setTremoloDepth does not throw", () => {
      const fx = new EffectsChain(ctx);
      expect(() => fx.setTremoloDepth(0.5)).not.toThrow();
    });

    it("setTone does not throw", () => {
      const fx = new EffectsChain(ctx);
      expect(() => fx.setTone(0.7)).not.toThrow();
    });

    it("dispose does not throw", () => {
      const fx = new EffectsChain(ctx);
      expect(() => fx.dispose()).not.toThrow();
    });
  });
});
