import { describe, expect, it } from "vitest";
import { codeToMidiNote, KEY_MAP, KEY_LABELS } from "./key-mappings";

describe("KEY_MAP", () => {
  it("has entries for lower white keys (Z-M)", () => {
    const codes = ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM"];
    for (const code of codes) {
      expect(KEY_MAP).toHaveProperty(code);
    }
  });

  it("has entries for lower black keys (S,D,G,H,J)", () => {
    const codes = ["KeyS", "KeyD", "KeyG", "KeyH", "KeyJ"];
    for (const code of codes) {
      expect(KEY_MAP).toHaveProperty(code);
    }
  });

  it("has entries for upper white keys (Q-U)", () => {
    const codes = ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU"];
    for (const code of codes) {
      expect(KEY_MAP).toHaveProperty(code);
    }
  });

  it("has entries for upper black keys (2,3,5,6,7)", () => {
    const codes = ["Digit2", "Digit3", "Digit5", "Digit6", "Digit7"];
    for (const code of codes) {
      expect(KEY_MAP).toHaveProperty(code);
    }
  });

  it("has entries for bridge keys (Comma, Period, Slash, K, L)", () => {
    const codes = ["Comma", "Period", "Slash", "KeyK", "KeyL"];
    for (const code of codes) {
      expect(KEY_MAP).toHaveProperty(code);
    }
  });

  it("has entries for extension keys (I, O, P, [, ], 9, 0, =)", () => {
    const codes = [
      "KeyI",
      "KeyO",
      "KeyP",
      "BracketLeft",
      "BracketRight",
      "Digit9",
      "Digit0",
      "Equal",
    ];
    for (const code of codes) {
      expect(KEY_MAP).toHaveProperty(code);
    }
  });

  it("has entries for pre-keys (ShiftLeft, Tab)", () => {
    expect(KEY_MAP).toHaveProperty("ShiftLeft");
    expect(KEY_MAP).toHaveProperty("Tab");
  });

  it("does not map gap keys", () => {
    const gaps = ["Digit1", "Digit4", "Digit8", "Minus", "KeyA", "KeyF", "CapsLock"];
    for (const code of gaps) {
      expect(KEY_MAP).not.toHaveProperty(code);
    }
  });
});

describe("KEY_LABELS", () => {
  it("has labels for all 24 primary keys", () => {
    expect(Object.keys(KEY_LABELS)).toHaveLength(24);
  });

  it("maps physical codes to display characters", () => {
    expect(KEY_LABELS["KeyZ"]).toBe("Z");
    expect(KEY_LABELS["Digit2"]).toBe("2");
    expect(KEY_LABELS["KeyQ"]).toBe("Q");
  });

  it("does not include bridge or extension keys", () => {
    expect(KEY_LABELS).not.toHaveProperty("Comma");
    expect(KEY_LABELS).not.toHaveProperty("KeyI");
    expect(KEY_LABELS).not.toHaveProperty("ShiftLeft");
  });
});

describe("codeToMidiNote", () => {
  it("maps KeyZ to C at octaveBase (offset 0)", () => {
    expect(codeToMidiNote("KeyZ", 0)).toBe(0);
  });

  it("maps Z-M to a C major scale at octaveBase 60", () => {
    const cMajor = [60, 62, 64, 65, 67, 69, 71];
    const codes = ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM"];
    codes.forEach((code, i) => {
      expect(codeToMidiNote(code, 60)).toBe(cMajor[i]);
    });
  });

  it("maps S,D to C#,D# (black keys)", () => {
    expect(codeToMidiNote("KeyS", 60)).toBe(61);
    expect(codeToMidiNote("KeyD", 60)).toBe(63);
  });

  it("maps upper octave starting at Q = C+12", () => {
    expect(codeToMidiNote("KeyQ", 60)).toBe(72);
    expect(codeToMidiNote("KeyW", 60)).toBe(74);
  });

  it("maps upper black keys Digit2,Digit3 = C#+12, D#+12", () => {
    expect(codeToMidiNote("Digit2", 60)).toBe(73);
    expect(codeToMidiNote("Digit3", 60)).toBe(75);
  });

  it("returns null for unmapped keys", () => {
    expect(codeToMidiNote("KeyA", 60)).toBeNull();
    expect(codeToMidiNote("Enter", 60)).toBeNull();
    expect(codeToMidiNote("Space", 60)).toBeNull();
  });

  it("shifts with octaveBase", () => {
    const base48 = codeToMidiNote("KeyZ", 48)!;
    const base60 = codeToMidiNote("KeyZ", 60)!;
    expect(base60 - base48).toBe(12);
  });

  it("maps bridge keys to same MIDI as primary keys", () => {
    // Comma should produce same note as KeyQ (both offset 12)
    expect(codeToMidiNote("Comma", 60)).toBe(codeToMidiNote("KeyQ", 60));
    // Period = KeyW (both offset 14)
    expect(codeToMidiNote("Period", 60)).toBe(codeToMidiNote("KeyW", 60));
    // Slash = KeyE (both offset 16)
    expect(codeToMidiNote("Slash", 60)).toBe(codeToMidiNote("KeyE", 60));
    // KeyK = Digit2 (both offset 13)
    expect(codeToMidiNote("KeyK", 60)).toBe(codeToMidiNote("Digit2", 60));
    // KeyL = Digit3 (both offset 15)
    expect(codeToMidiNote("KeyL", 60)).toBe(codeToMidiNote("Digit3", 60));
  });

  it("maps extension keys into 3rd octave", () => {
    expect(codeToMidiNote("KeyI", 60)).toBe(84); // offset 24
    expect(codeToMidiNote("KeyO", 60)).toBe(86); // offset 26
    expect(codeToMidiNote("KeyP", 60)).toBe(88); // offset 28
    expect(codeToMidiNote("BracketLeft", 60)).toBe(89); // offset 29
    expect(codeToMidiNote("BracketRight", 60)).toBe(91); // offset 31
    expect(codeToMidiNote("Digit9", 60)).toBe(85); // offset 25
    expect(codeToMidiNote("Digit0", 60)).toBe(87); // offset 27
    expect(codeToMidiNote("Equal", 60)).toBe(90); // offset 30
  });

  it("maps pre-keys correctly", () => {
    // ShiftLeft = B below lower octave (offset -1)
    expect(codeToMidiNote("ShiftLeft", 60)).toBe(59);
    // Tab = B below upper octave (offset 11, same as M)
    expect(codeToMidiNote("Tab", 60)).toBe(71);
  });

  it("maps a continuous chromatic scale from ShiftLeft through lower row", () => {
    const base = 60;
    // B, C, C#, D, D#, E, F, F#, G, G#, A, A#, B
    const expected = [59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71];
    const codes = [
      "ShiftLeft",
      "KeyZ", "KeyS", "KeyX", "KeyD", "KeyC", "KeyV",
      "KeyG", "KeyB", "KeyH", "KeyN", "KeyJ", "KeyM",
    ];
    codes.forEach((code, i) => {
      expect(codeToMidiNote(code, base)).toBe(expected[i]);
    });
  });
});
