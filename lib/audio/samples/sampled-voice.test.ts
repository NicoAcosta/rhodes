import { describe, expect, it, vi, beforeEach } from "vitest";
import { SampledVoice } from "./sampled-voice";

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

function mockGain() {
  return {
    gain: mockParam(0),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function mockBufferSource() {
  return {
    buffer: null as AudioBuffer | null,
    playbackRate: mockParam(1),
    loop: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as (() => void) | null,
  };
}

function createMockContext(time = 0) {
  const gains: ReturnType<typeof mockGain>[] = [];
  const sources: ReturnType<typeof mockBufferSource>[] = [];

  return {
    currentTime: time,
    createGain: vi.fn(() => {
      const g = mockGain();
      gains.push(g);
      return g;
    }),
    createBufferSource: vi.fn(() => {
      const s = mockBufferSource();
      sources.push(s);
      return s;
    }),
    gains,
    sources,
  } as unknown as AudioContext & {
    gains: ReturnType<typeof mockGain>[];
    sources: ReturnType<typeof mockBufferSource>[];
  };
}

const mockBuffer = {} as AudioBuffer;

describe("SampledVoice", () => {
  let ctx: ReturnType<typeof createMockContext>;
  const dest = { connect: vi.fn() } as unknown as AudioNode;

  beforeEach(() => {
    ctx = createMockContext(1.0);
    vi.useFakeTimers();
  });

  it("implements IVoice with correct midi", () => {
    const voice = new SampledVoice(ctx, 60, dest, mockBuffer, 1.0);
    expect(voice.midi).toBe(60);
  });

  it("creates a buffer source and a gain node", () => {
    new SampledVoice(ctx, 60, dest, mockBuffer, 1.0);
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
    expect(ctx.createGain).toHaveBeenCalledTimes(1);
  });

  it("sets buffer and playback rate on source", () => {
    new SampledVoice(ctx, 60, dest, mockBuffer, 1.5);
    const source = ctx.sources[0];
    expect(source.buffer).toBe(mockBuffer);
    expect(source.playbackRate.setValueAtTime).toHaveBeenCalledWith(1.5, 1.0);
  });

  it("connects source → gain → destination", () => {
    new SampledVoice(ctx, 60, dest, mockBuffer, 1.0);
    const source = ctx.sources[0];
    const gain = ctx.gains[0];
    expect(source.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(dest);
  });

  it("starts the source immediately", () => {
    new SampledVoice(ctx, 60, dest, mockBuffer, 1.0);
    expect(ctx.sources[0].start).toHaveBeenCalledWith(1.0);
  });

  describe("velocity scaling", () => {
    it("default velocity (100) produces gain in expected range", () => {
      new SampledVoice(ctx, 60, dest, mockBuffer, 1.0);
      const gainValue = ctx.gains[0].gain.setValueAtTime.mock.calls[0][0];
      expect(gainValue).toBeGreaterThan(0.3);
      expect(gainValue).toBeLessThanOrEqual(1.0);
    });

    it("soft velocity produces lower gain than hard", () => {
      new SampledVoice(ctx, 60, dest, mockBuffer, 1.0, 40);
      const softGain = ctx.gains[0].gain.setValueAtTime.mock.calls[0][0];

      ctx = createMockContext(1.0);
      new SampledVoice(ctx, 60, dest, mockBuffer, 1.0, 120);
      const hardGain = ctx.gains[0].gain.setValueAtTime.mock.calls[0][0];

      expect(hardGain).toBeGreaterThan(softGain);
    });

    it("minimum velocity still produces audible gain (>= 0.3)", () => {
      new SampledVoice(ctx, 60, dest, mockBuffer, 1.0, 1);
      const minGain = ctx.gains[0].gain.setValueAtTime.mock.calls[0][0];
      expect(minGain).toBeGreaterThanOrEqual(0.3);
    });
  });

  describe("release", () => {
    it("fades out gain over ~0.5s", () => {
      const voice = new SampledVoice(ctx, 60, dest, mockBuffer, 1.0);
      voice.release();

      const gain = ctx.gains[0].gain;
      expect(gain.cancelScheduledValues).toHaveBeenCalled();
      expect(gain.setValueAtTime).toHaveBeenCalledTimes(2); // init + release
      expect(gain.exponentialRampToValueAtTime).toHaveBeenCalled();

      const rampCall = gain.exponentialRampToValueAtTime.mock.calls[0];
      expect(rampCall[0]).toBeLessThanOrEqual(0.001); // near zero
      expect(rampCall[1] - 1.0).toBeCloseTo(0.5, 1); // 0.5s from now
    });

    it("is idempotent", () => {
      const voice = new SampledVoice(ctx, 60, dest, mockBuffer, 1.0);
      voice.release();
      voice.release();
      expect(ctx.gains[0].gain.cancelScheduledValues).toHaveBeenCalledTimes(1);
    });
  });

  describe("dispose", () => {
    it("stops source and disconnects all nodes", () => {
      const voice = new SampledVoice(ctx, 60, dest, mockBuffer, 1.0);
      voice.dispose();

      expect(ctx.sources[0].stop).toHaveBeenCalled();
      expect(ctx.sources[0].disconnect).toHaveBeenCalled();
      expect(ctx.gains[0].disconnect).toHaveBeenCalled();
    });

    it("is idempotent", () => {
      const voice = new SampledVoice(ctx, 60, dest, mockBuffer, 1.0);
      voice.dispose();
      voice.dispose();
      expect(ctx.sources[0].stop).toHaveBeenCalledTimes(1);
    });
  });

  it("auto-disposes via onended callback", () => {
    new SampledVoice(ctx, 60, dest, mockBuffer, 1.0);
    const source = ctx.sources[0];
    expect(source.onended).toBeTypeOf("function");

    // Simulate sample ending naturally
    source.onended!();
    expect(source.disconnect).toHaveBeenCalled();
    expect(ctx.gains[0].disconnect).toHaveBeenCalled();
  });
});
