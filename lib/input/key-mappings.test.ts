import { describe, expect, it } from "vitest";
import { keyToMidiNote, KEY_LAYOUT } from "./key-mappings";

describe("KEY_LAYOUT", () => {
  it("has entries for lower white keys (Z-M)", () => {
    expect(KEY_LAYOUT).toHaveProperty("z");
    expect(KEY_LAYOUT).toHaveProperty("x");
    expect(KEY_LAYOUT).toHaveProperty("c");
    expect(KEY_LAYOUT).toHaveProperty("v");
    expect(KEY_LAYOUT).toHaveProperty("b");
    expect(KEY_LAYOUT).toHaveProperty("n");
    expect(KEY_LAYOUT).toHaveProperty("m");
  });

  it("has entries for lower black keys (S,D,G,H,J)", () => {
    expect(KEY_LAYOUT).toHaveProperty("s");
    expect(KEY_LAYOUT).toHaveProperty("d");
    expect(KEY_LAYOUT).toHaveProperty("g");
    expect(KEY_LAYOUT).toHaveProperty("h");
    expect(KEY_LAYOUT).toHaveProperty("j");
  });

  it("has entries for upper white keys (Q-U)", () => {
    expect(KEY_LAYOUT).toHaveProperty("q");
    expect(KEY_LAYOUT).toHaveProperty("w");
    expect(KEY_LAYOUT).toHaveProperty("e");
    expect(KEY_LAYOUT).toHaveProperty("r");
    expect(KEY_LAYOUT).toHaveProperty("t");
    expect(KEY_LAYOUT).toHaveProperty("y");
    expect(KEY_LAYOUT).toHaveProperty("u");
  });

  it("has entries for upper black keys (2,3,5,6,7)", () => {
    expect(KEY_LAYOUT).toHaveProperty("2");
    expect(KEY_LAYOUT).toHaveProperty("3");
    expect(KEY_LAYOUT).toHaveProperty("5");
    expect(KEY_LAYOUT).toHaveProperty("6");
    expect(KEY_LAYOUT).toHaveProperty("7");
  });
});

describe("keyToMidiNote", () => {
  it("maps Z to C at octaveBase (offset 0)", () => {
    expect(keyToMidiNote("z", 0)).toBe(0);
  });

  it("maps Z-M to a C major scale at octaveBase 60", () => {
    const cMajor = [60, 62, 64, 65, 67, 69, 71];
    const keys = ["z", "x", "c", "v", "b", "n", "m"];
    keys.forEach((key, i) => {
      expect(keyToMidiNote(key, 60)).toBe(cMajor[i]);
    });
  });

  it("maps S,D to C#,D# (black keys)", () => {
    expect(keyToMidiNote("s", 60)).toBe(61);
    expect(keyToMidiNote("d", 60)).toBe(63);
  });

  it("maps upper octave starting at Q = C+12", () => {
    expect(keyToMidiNote("q", 60)).toBe(72);
    expect(keyToMidiNote("w", 60)).toBe(74);
  });

  it("maps upper black keys 2,3 = C#+12, D#+12", () => {
    expect(keyToMidiNote("2", 60)).toBe(73);
    expect(keyToMidiNote("3", 60)).toBe(75);
  });

  it("returns null for unmapped keys", () => {
    expect(keyToMidiNote("a", 60)).toBeNull();
    expect(keyToMidiNote("Enter", 60)).toBeNull();
    expect(keyToMidiNote(" ", 60)).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(keyToMidiNote("Z", 60)).toBe(keyToMidiNote("z", 60));
    expect(keyToMidiNote("Q", 60)).toBe(keyToMidiNote("q", 60));
  });

  it("shifts with octaveBase", () => {
    const base48 = keyToMidiNote("z", 48)!;
    const base60 = keyToMidiNote("z", 60)!;
    expect(base60 - base48).toBe(12);
  });
});
