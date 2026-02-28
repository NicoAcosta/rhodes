/**
 * Keyboard layout mapping: physical key → semitone offset from octave base.
 *
 * Lower row = octave 1:
 *   Black:  S  D     G  H  J        (C# D#    F# G# A#)
 *   White: Z  X  C  V  B  N  M      (C  D  E  F  G  A  B)
 *
 * Upper row = octave 2 (+12):
 *   Black:  2  3     5  6  7        (C# D#    F# G# A#)
 *   White: Q  W  E  R  T  Y  U      (C  D  E  F  G  A  B)
 */
export const KEY_LAYOUT: Record<string, number> = {
  // Lower octave — white keys
  z: 0, // C
  x: 2, // D
  c: 4, // E
  v: 5, // F
  b: 7, // G
  n: 9, // A
  m: 11, // B

  // Lower octave — black keys
  s: 1, // C#
  d: 3, // D#
  g: 6, // F#
  h: 8, // G#
  j: 10, // A#

  // Upper octave — white keys (+12)
  q: 12, // C
  w: 14, // D
  e: 16, // E
  r: 17, // F
  t: 19, // G
  y: 21, // A
  u: 23, // B

  // Upper octave — black keys (+12)
  "2": 13, // C#
  "3": 15, // D#
  "5": 18, // F#
  "6": 20, // G#
  "7": 22, // A#
};

/** Map a physical keyboard key to a MIDI note number. Returns null if unmapped. */
export function keyToMidiNote(
  key: string,
  octaveBase: number
): number | null {
  const offset = KEY_LAYOUT[key.toLowerCase()];
  if (offset === undefined) return null;
  return octaveBase + offset;
}
