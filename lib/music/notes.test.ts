import { describe, expect, it } from "vitest";
import { midiToFrequency, midiToNoteName, noteNameToMidi } from "./notes";

describe("midiToFrequency", () => {
  it("returns 440Hz for A4 (MIDI 69)", () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 2);
  });

  it("returns 261.63Hz for middle C (MIDI 60)", () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
  });

  it("doubles frequency for octave up", () => {
    const f1 = midiToFrequency(60);
    const f2 = midiToFrequency(72);
    expect(f2).toBeCloseTo(f1 * 2, 2);
  });

  it("halves frequency for octave down", () => {
    const f1 = midiToFrequency(60);
    const f2 = midiToFrequency(48);
    expect(f2).toBeCloseTo(f1 / 2, 2);
  });
});

describe("midiToNoteName", () => {
  it("returns C4 for MIDI 60", () => {
    expect(midiToNoteName(60)).toBe("C4");
  });

  it("returns A4 for MIDI 69", () => {
    expect(midiToNoteName(69)).toBe("A4");
  });

  it("returns C#3 for MIDI 49", () => {
    expect(midiToNoteName(49)).toBe("C#3");
  });

  it("returns B5 for MIDI 83", () => {
    expect(midiToNoteName(83)).toBe("B5");
  });

  it("returns C1 for MIDI 24", () => {
    expect(midiToNoteName(24)).toBe("C1");
  });
});

describe("noteNameToMidi", () => {
  it("returns 60 for C4", () => {
    expect(noteNameToMidi("C4")).toBe(60);
  });

  it("returns 69 for A4", () => {
    expect(noteNameToMidi("A4")).toBe(69);
  });

  it("handles sharps", () => {
    expect(noteNameToMidi("C#3")).toBe(49);
    expect(noteNameToMidi("F#4")).toBe(66);
  });

  it("returns null for invalid input", () => {
    expect(noteNameToMidi("X9")).toBeNull();
    expect(noteNameToMidi("")).toBeNull();
  });

  it("roundtrips with midiToNoteName", () => {
    for (let midi = 24; midi <= 96; midi++) {
      const name = midiToNoteName(midi);
      expect(noteNameToMidi(name)).toBe(midi);
    }
  });
});
