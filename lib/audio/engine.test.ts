import { describe, expect, it, vi } from "vitest";
import { AudioEngine } from "./engine";
import type { IVoice } from "./voice";

function createMockVoice(midi: number): IVoice {
  return {
    midi,
    release: vi.fn(),
    dispose: vi.fn(),
  };
}

describe("AudioEngine", () => {
  describe("noteOn with velocity", () => {
    it("factory type accepts optional velocity parameter", () => {
      const velocities: (number | undefined)[] = [];
      const factory = vi.fn(
        (ctx: AudioContext, midi: number, dest: AudioNode, velocity?: number) => {
          velocities.push(velocity);
          return createMockVoice(midi);
        }
      );
      // Type check passes — factory accepts velocity
      expect(new AudioEngine(factory)).toBeDefined();
    });
  });

  describe("setChorusMix", () => {
    it("does not throw when effects not initialized", () => {
      const engine = new AudioEngine();
      expect(() => engine.setChorusMix(0.5)).not.toThrow();
    });
  });
});
