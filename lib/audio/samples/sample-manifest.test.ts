import { describe, expect, it } from "vitest";
import {
  TIER_1_SAMPLES,
  TIER_2_SAMPLES,
  sampleUrl,
} from "./sample-manifest";

describe("sample-manifest", () => {
  describe("TIER_2_SAMPLES (all roots)", () => {
    it("has 15 root notes", () => {
      expect(TIER_2_SAMPLES).toHaveLength(15);
    });

    it("entries are sorted by MIDI number ascending", () => {
      for (let i = 1; i < TIER_2_SAMPLES.length; i++) {
        expect(TIER_2_SAMPLES[i].midi).toBeGreaterThan(
          TIER_2_SAMPLES[i - 1].midi
        );
      }
    });

    it("each entry has valid MIDI number (24-96 range)", () => {
      for (const entry of TIER_2_SAMPLES) {
        expect(entry.midi).toBeGreaterThanOrEqual(24);
        expect(entry.midi).toBeLessThanOrEqual(96);
      }
    });

    it("each entry has a non-empty name", () => {
      for (const entry of TIER_2_SAMPLES) {
        expect(entry.name.length).toBeGreaterThan(0);
      }
    });

    it("each entry has 5 velocity layers", () => {
      for (const entry of TIER_2_SAMPLES) {
        expect(entry.velocityLayers).toBe(5);
      }
    });

    it("velocity thresholds are sorted ascending and within 1-127", () => {
      for (const entry of TIER_2_SAMPLES) {
        expect(entry.velocityThresholds.length).toBe(entry.velocityLayers);
        for (let i = 0; i < entry.velocityThresholds.length; i++) {
          expect(entry.velocityThresholds[i]).toBeGreaterThanOrEqual(1);
          expect(entry.velocityThresholds[i]).toBeLessThanOrEqual(127);
          if (i > 0) {
            expect(entry.velocityThresholds[i]).toBeGreaterThan(
              entry.velocityThresholds[i - 1]
            );
          }
        }
      }
    });

    it("contains the correct root MIDI numbers from jRhodes3c", () => {
      const midis = TIER_2_SAMPLES.map((e) => e.midi);
      expect(midis).toEqual([
        29, 35, 40, 45, 50, 55, 59, 62, 65, 71, 76, 81, 86, 91, 96,
      ]);
    });
  });

  describe("TIER_1_SAMPLES", () => {
    it("has 8 entries", () => {
      expect(TIER_1_SAMPLES).toHaveLength(8);
    });

    it("is a subset of TIER_2 root MIDI numbers", () => {
      const tier2Midis = new Set(TIER_2_SAMPLES.map((e) => e.midi));
      for (const entry of TIER_1_SAMPLES) {
        expect(tier2Midis.has(entry.midi)).toBe(true);
      }
    });

    it("entries are sorted by MIDI number ascending", () => {
      for (let i = 1; i < TIER_1_SAMPLES.length; i++) {
        expect(TIER_1_SAMPLES[i].midi).toBeGreaterThan(
          TIER_1_SAMPLES[i - 1].midi
        );
      }
    });

    it("each entry has exactly 1 velocity layer (v3 only)", () => {
      for (const entry of TIER_1_SAMPLES) {
        expect(entry.velocityLayers).toBe(1);
        expect(entry.velocityThresholds).toHaveLength(1);
      }
    });
  });

  describe("sampleUrl", () => {
    it("builds correct URL for a sample", () => {
      expect(sampleUrl("C4", 3)).toBe("/samples/C4_v3.mp3");
    });

    it("works for different velocity layers", () => {
      expect(sampleUrl("F1", 1)).toBe("/samples/F1_v1.mp3");
      expect(sampleUrl("F1", 5)).toBe("/samples/F1_v5.mp3");
    });
  });
});
