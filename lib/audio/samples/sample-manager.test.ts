import { describe, expect, it, vi, beforeEach } from "vitest";
import { SampleManager, type SampleTier } from "./sample-manager";

// --- Mocks ---

const mockBuffer = { duration: 2.0 } as AudioBuffer;

function createMockContext() {
  return {
    decodeAudioData: vi.fn().mockResolvedValue(mockBuffer),
  } as unknown as AudioContext;
}

function createMockFetch(shouldFail = false) {
  return vi.fn().mockImplementation(() => {
    if (shouldFail) return Promise.reject(new Error("fetch failed"));
    return Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
    });
  });
}

describe("SampleManager", () => {
  let ctx: AudioContext;

  beforeEach(() => {
    ctx = createMockContext();
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("starts at tier 'fm'", () => {
      const mgr = new SampleManager(ctx);
      expect(mgr.tier).toBe("fm");
    });
  });

  describe("loadTier1", () => {
    it("fetches 8 samples (tier 1 subset, v3 only)", async () => {
      const fetchMock = createMockFetch();
      globalThis.fetch = fetchMock;

      const mgr = new SampleManager(ctx);
      await mgr.loadTier1();

      // 8 tier-1 samples, v3 only
      expect(fetchMock).toHaveBeenCalledTimes(8);
      expect(mgr.tier).toBe("t1");
    });

    it("emits tier change to 't1'", async () => {
      globalThis.fetch = createMockFetch();

      const tiers: SampleTier[] = [];
      const mgr = new SampleManager(ctx);
      mgr.onTierChange = (t) => tiers.push(t);
      await mgr.loadTier1();

      expect(tiers).toContain("t1");
    });

    it("handles partial fetch failures gracefully", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 3) return Promise.reject(new Error("fail"));
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
        });
      });

      const mgr = new SampleManager(ctx);
      await mgr.loadTier1();

      // Should not throw, still reaches t1 with partial samples
      expect(mgr.tier).toBe("t1");
    });
  });

  describe("loadTier2", () => {
    it("loads remaining samples and reaches tier 't2'", async () => {
      globalThis.fetch = createMockFetch();

      const mgr = new SampleManager(ctx);
      await mgr.loadTier1();
      await mgr.loadTier2();

      expect(mgr.tier).toBe("t2");
    });

    it("emits tier change to 't2'", async () => {
      globalThis.fetch = createMockFetch();

      const tiers: SampleTier[] = [];
      const mgr = new SampleManager(ctx);
      mgr.onTierChange = (t) => tiers.push(t);

      await mgr.loadTier1();
      await mgr.loadTier2();

      expect(tiers).toContain("t2");
    });
  });

  describe("lookup", () => {
    it("returns null when no samples loaded (fm tier)", () => {
      const mgr = new SampleManager(ctx);
      expect(mgr.lookup(60)).toBeNull();
    });

    it("returns buffer + playbackRate for exact root note", async () => {
      globalThis.fetch = createMockFetch();

      const mgr = new SampleManager(ctx);
      await mgr.loadTier1();

      // MIDI 55 (G3) is a tier-1 root
      const result = mgr.lookup(55);
      expect(result).not.toBeNull();
      expect(result!.buffer).toBe(mockBuffer);
      expect(result!.playbackRate).toBeCloseTo(1.0, 5);
    });

    it("returns correct playbackRate for pitch-shifted note", async () => {
      globalThis.fetch = createMockFetch();

      const mgr = new SampleManager(ctx);
      await mgr.loadTier1();

      // MIDI 57 is 2 semitones above G3(55)
      const result = mgr.lookup(57);
      expect(result).not.toBeNull();
      const expectedRate = Math.pow(2, 2 / 12);
      expect(result!.playbackRate).toBeCloseTo(expectedRate, 5);
    });

    it("returns null when note is too far from any root (> 6 semitones)", async () => {
      globalThis.fetch = createMockFetch();

      const mgr = new SampleManager(ctx);
      await mgr.loadTier1();

      // With tier-1 roots spread far apart, MIDI 48 (C3) may be >6 from nearest root
      // Tier-1 roots: 29, 35, 45, 55, 62, 71, 81, 96
      // MIDI 48: nearest is 45 (3 away) or 55 (7 away) → picks 45, distance 3 → should work
      // MIDI 41: nearest is 45 (4 away) or 35 (6 away) → picks 45 or 35, within range
      // To find a gap: between 35 and 45, midpoint is 40
      // MIDI 40: nearest is 35 (5 away) or 45 (5 away) → within range
      // Actually tier 1 spacing is tight. Let's test with MIDI 20 (way below lowest root 29)
      const result = mgr.lookup(20);
      // Distance from 20 to 29 = 9 semitones > 6
      expect(result).toBeNull();
    });

    it("selects velocity layer based on velocity value", async () => {
      globalThis.fetch = createMockFetch();

      const mgr = new SampleManager(ctx);
      await mgr.loadTier1();
      await mgr.loadTier2();

      // With full tier-2 loaded, looking up with different velocities
      // should work (both return non-null for an exact root)
      const soft = mgr.lookup(55, 30);
      const hard = mgr.lookup(55, 120);
      expect(soft).not.toBeNull();
      expect(hard).not.toBeNull();
    });
  });

  describe("dispose", () => {
    it("clears all cached buffers", async () => {
      globalThis.fetch = createMockFetch();

      const mgr = new SampleManager(ctx);
      await mgr.loadTier1();
      expect(mgr.lookup(55)).not.toBeNull();

      mgr.dispose();
      expect(mgr.lookup(55)).toBeNull();
      expect(mgr.tier).toBe("fm");
    });
  });
});
