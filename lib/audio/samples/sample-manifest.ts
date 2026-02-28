export interface SampleEntry {
  /** MIDI note number of the root sample */
  midi: number;
  /** Note name (e.g. "F1", "C7") */
  name: string;
  /** Number of velocity layers available */
  velocityLayers: number;
  /** Upper velocity bounds per layer, ascending (e.g. [47, 72, 95, 111, 127]) */
  velocityThresholds: number[];
}

/** All velocity thresholds from jRhodes3c SFZ mapping */
const ALL_THRESHOLDS = [47, 72, 95, 111, 127] as const;

/**
 * Tier 1: 8 samples, medium velocity (v3) only.
 * Spread roughly one per octave for quick initial load (~400KB).
 */
export const TIER_1_SAMPLES: SampleEntry[] = [
  { midi: 29, name: "F1", velocityLayers: 1, velocityThresholds: [127] },
  { midi: 35, name: "B1", velocityLayers: 1, velocityThresholds: [127] },
  { midi: 45, name: "A2", velocityLayers: 1, velocityThresholds: [127] },
  { midi: 55, name: "G3", velocityLayers: 1, velocityThresholds: [127] },
  { midi: 62, name: "D4", velocityLayers: 1, velocityThresholds: [127] },
  { midi: 71, name: "B4", velocityLayers: 1, velocityThresholds: [127] },
  { midi: 81, name: "A5", velocityLayers: 1, velocityThresholds: [127] },
  { midi: 96, name: "C7", velocityLayers: 1, velocityThresholds: [127] },
];

/**
 * Tier 2: all 15 root notes, 5 velocity layers each.
 * Full jRhodes3c sample set (~3.6MB MP3).
 */
export const TIER_2_SAMPLES: SampleEntry[] = [
  { midi: 29, name: "F1", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 35, name: "B1", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 40, name: "E2", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 45, name: "A2", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 50, name: "D3", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 55, name: "G3", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 59, name: "B3", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 62, name: "D4", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 65, name: "F4", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 71, name: "B4", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 76, name: "E5", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 81, name: "A5", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 86, name: "D6", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 91, name: "G6", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
  { midi: 96, name: "C7", velocityLayers: 5, velocityThresholds: [...ALL_THRESHOLDS] },
];

/** Build URL for a sample file. */
export function sampleUrl(name: string, velocityLayer: number): string {
  return `/samples/${name}_v${velocityLayer}.mp3`;
}
