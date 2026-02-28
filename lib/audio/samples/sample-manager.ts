import {
  TIER_1_SAMPLES,
  TIER_2_SAMPLES,
  sampleUrl,
  type SampleEntry,
} from "./sample-manifest";

export type SampleTier = "fm" | "loading-t1" | "t1" | "loading-t2" | "t2";

export interface SampleLookup {
  buffer: AudioBuffer;
  playbackRate: number;
}

/** Cache key: "name_vLayer" */
type CacheKey = string;

/**
 * Manages loading, caching, and lookup of Rhodes samples.
 *
 * Loading tiers:
 *   fm → loading-t1 → t1 → loading-t2 → t2
 *
 * Lookup: binary search for nearest root, select velocity layer,
 * compute playback rate for pitch shifting.
 */
export class SampleManager {
  private cache = new Map<CacheKey, AudioBuffer>();
  private loadedRoots: SampleEntry[] = [];
  private _tier: SampleTier = "fm";

  onTierChange: ((tier: SampleTier) => void) | null = null;

  constructor(private ctx: AudioContext) {}

  get tier(): SampleTier {
    return this._tier;
  }

  private setTier(tier: SampleTier): void {
    this._tier = tier;
    this.onTierChange?.(tier);
  }

  /** Load tier 1: 8 samples, v3 only. Fast initial load. */
  async loadTier1(): Promise<void> {
    this.setTier("loading-t1");

    const results = await Promise.allSettled(
      TIER_1_SAMPLES.map(async (entry) => {
        const key = cacheKey(entry.name, 3);
        if (this.cache.has(key)) return;
        const buffer = await this.fetchAndDecode(sampleUrl(entry.name, 3));
        if (buffer) this.cache.set(key, buffer);
      })
    );

    // Rebuild loaded roots from what's actually in cache
    this.rebuildLoadedRoots();
    this.setTier("t1");

    // Count successes for logging
    const successes = results.filter((r) => r.status === "fulfilled").length;
    if (successes < TIER_1_SAMPLES.length) {
      console.warn(
        `SampleManager: ${successes}/${TIER_1_SAMPLES.length} tier-1 samples loaded`
      );
    }
  }

  /** Load tier 2: all roots, all velocity layers. */
  async loadTier2(): Promise<void> {
    this.setTier("loading-t2");

    const BATCH_SIZE = 6;
    const allJobs: { entry: SampleEntry; layer: number }[] = [];

    for (const entry of TIER_2_SAMPLES) {
      for (let layer = 1; layer <= entry.velocityLayers; layer++) {
        const key = cacheKey(entry.name, layer);
        if (!this.cache.has(key)) {
          allJobs.push({ entry, layer });
        }
      }
    }

    // Load in batches to avoid overwhelming the network
    for (let i = 0; i < allJobs.length; i += BATCH_SIZE) {
      const batch = allJobs.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async ({ entry, layer }) => {
          const key = cacheKey(entry.name, layer);
          const buffer = await this.fetchAndDecode(
            sampleUrl(entry.name, layer)
          );
          if (buffer) this.cache.set(key, buffer);
        })
      );
    }

    this.rebuildLoadedRoots();
    this.setTier("t2");
  }

  /**
   * Look up sample data for a MIDI note.
   * Returns buffer + playbackRate, or null if no suitable sample is loaded.
   */
  lookup(midi: number, velocity?: number): SampleLookup | null {
    if (this.loadedRoots.length === 0) return null;

    // Binary search for nearest root
    const nearest = this.findNearestRoot(midi);
    if (!nearest) return null;

    const distance = Math.abs(midi - nearest.midi);
    if (distance > 6) return null;

    // Select velocity layer, falling back to any cached layer
    const vel = velocity ?? 100;
    const buffer = this.findBuffer(nearest, vel);
    if (!buffer) return null;

    // Compute pitch shift
    const playbackRate = Math.pow(2, (midi - nearest.midi) / 12);

    return { buffer, playbackRate };
  }

  dispose(): void {
    this.cache.clear();
    this.loadedRoots = [];
    this._tier = "fm";
  }

  // --- Private ---

  private async fetchAndDecode(url: string): Promise<AudioBuffer | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      return await this.ctx.decodeAudioData(arrayBuffer);
    } catch {
      return null;
    }
  }

  /** Rebuild the sorted list of roots that have at least one cached buffer. */
  private rebuildLoadedRoots(): void {
    this.loadedRoots = TIER_2_SAMPLES.filter((entry) => {
      // Check if any velocity layer is cached for this root
      for (let l = 1; l <= 5; l++) {
        if (this.cache.has(cacheKey(entry.name, l))) return true;
      }
      return false;
    });
  }

  /** Binary search for nearest root note. */
  private findNearestRoot(midi: number): SampleEntry | null {
    const roots = this.loadedRoots;
    if (roots.length === 0) return null;

    let lo = 0;
    let hi = roots.length - 1;

    // Edge cases
    if (midi <= roots[0].midi) return roots[0];
    if (midi >= roots[hi].midi) return roots[hi];

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (roots[mid].midi === midi) return roots[mid];
      if (roots[mid].midi < midi) lo = mid + 1;
      else hi = mid - 1;
    }

    // lo and hi have crossed; nearest is either roots[hi] or roots[lo]
    const distLo = lo < roots.length ? Math.abs(roots[lo].midi - midi) : Infinity;
    const distHi = hi >= 0 ? Math.abs(roots[hi].midi - midi) : Infinity;
    return distLo <= distHi ? roots[lo] : roots[hi];
  }

  /** Find a cached buffer for the given root and velocity. Tries exact layer first, then any cached layer. */
  private findBuffer(entry: SampleEntry, velocity: number): AudioBuffer | null {
    // Try exact velocity layer first (using TIER_2 thresholds for selection)
    const tier2Entry = TIER_2_SAMPLES.find((e) => e.midi === entry.midi);
    if (tier2Entry) {
      const thresholds = tier2Entry.velocityThresholds;
      for (let i = 0; i < thresholds.length; i++) {
        if (velocity <= thresholds[i]) {
          const buffer = this.cache.get(cacheKey(entry.name, i + 1));
          if (buffer) return buffer;
          break;
        }
      }
    }

    // Fall back to any cached layer for this root
    for (let l = 1; l <= 5; l++) {
      const buffer = this.cache.get(cacheKey(entry.name, l));
      if (buffer) return buffer;
    }

    return null;
  }
}

function cacheKey(name: string, layer: number): CacheKey {
  return `${name}_v${layer}`;
}
