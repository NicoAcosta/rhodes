/**
 * Keyboard layout mapping: physical key code → semitone offset from octave base.
 *
 * Uses e.code (physical key position) instead of e.key so the mapping is
 * modifier-independent and works across keyboard layouts (QWERTY, AZERTY, Dvorak).
 *
 * Pre-lower:    ShiftLeft → B below lower octave
 *
 * Lower row = octave 1:
 *   Black:  S  D     G  H  J        (C# D#    F# G# A#)
 *   White: Z  X  C  V  B  N  M      (C  D  E  F  G  A  B)
 *
 * Bridge (lower→upper, duplicates upper row):
 *   Black:  K  L
 *   White: ,  .  /
 *
 * Pre-upper:    Tab → B below upper octave (same as M)
 *
 * Upper row = octave 2 (+12):
 *   Black:  2  3     5  6  7        (C# D#    F# G# A#)
 *   White: Q  W  E  R  T  Y  U      (C  D  E  F  G  A  B)
 *
 * Extension (3rd octave partial, +24):
 *   Black:  9  0     =
 *   White: I  O  P  [  ]
 */
export const KEY_MAP: Record<string, number> = {
  // Pre-lower — B below
  ShiftLeft: -1,

  // Lower octave — white keys
  KeyZ: 0, // C
  KeyX: 2, // D
  KeyC: 4, // E
  KeyV: 5, // F
  KeyB: 7, // G
  KeyN: 9, // A
  KeyM: 11, // B

  // Lower octave — black keys
  KeyS: 1, // C#
  KeyD: 3, // D#
  KeyG: 6, // F#
  KeyH: 8, // G#
  KeyJ: 10, // A#

  // Bridge — white keys (duplicate upper row start)
  Comma: 12, // C
  Period: 14, // D
  Slash: 16, // E

  // Bridge — black keys
  KeyK: 13, // C#
  KeyL: 15, // D#

  // Pre-upper — B below upper octave
  Tab: 11,

  // Upper octave — white keys (+12)
  KeyQ: 12, // C
  KeyW: 14, // D
  KeyE: 16, // E
  KeyR: 17, // F
  KeyT: 19, // G
  KeyY: 21, // A
  KeyU: 23, // B

  // Upper octave — black keys (+12)
  Digit2: 13, // C#
  Digit3: 15, // D#
  Digit5: 18, // F#
  Digit6: 20, // G#
  Digit7: 22, // A#

  // Extension — white keys (+24)
  KeyI: 24, // C
  KeyO: 26, // D
  KeyP: 28, // E
  BracketLeft: 29, // F
  BracketRight: 31, // G

  // Extension — black keys (+24)
  Digit9: 25, // C#
  Digit0: 27, // D#
  Equal: 30, // F#
};

/**
 * Display labels for the primary 24 keys (2 octaves).
 * Bridge, extension, and pre-keys are intentionally excluded.
 */
export const KEY_LABELS: Record<string, string> = {
  // Lower octave — white
  KeyZ: "Z",
  KeyX: "X",
  KeyC: "C",
  KeyV: "V",
  KeyB: "B",
  KeyN: "N",
  KeyM: "M",
  // Lower octave — black
  KeyS: "S",
  KeyD: "D",
  KeyG: "G",
  KeyH: "H",
  KeyJ: "J",
  // Upper octave — white
  KeyQ: "Q",
  KeyW: "W",
  KeyE: "E",
  KeyR: "R",
  KeyT: "T",
  KeyY: "Y",
  KeyU: "U",
  // Upper octave — black
  Digit2: "2",
  Digit3: "3",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
};

/** Map a physical key code to a MIDI note number. Returns null if unmapped. */
export function codeToMidiNote(
  code: string,
  octaveBase: number
): number | null {
  const offset = KEY_MAP[code];
  if (offset === undefined) return null;
  return octaveBase + offset;
}
