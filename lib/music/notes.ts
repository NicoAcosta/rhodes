const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

/** Convert MIDI note number to frequency in Hz. A4 (69) = 440Hz. */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Convert MIDI note number to note name (e.g. 60 → "C4"). */
export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/** Convert note name to MIDI number (e.g. "C4" → 60). Returns null if invalid. */
export function noteNameToMidi(name: string): number | null {
  const match = name.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return null;

  const [, note, octaveStr] = match;
  const noteIndex = NOTE_NAMES.indexOf(note as (typeof NOTE_NAMES)[number]);
  if (noteIndex === -1) return null;

  const octave = parseInt(octaveStr, 10);
  return (octave + 1) * 12 + noteIndex;
}
