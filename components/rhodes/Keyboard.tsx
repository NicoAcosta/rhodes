import { useRef } from "react";
import { Key } from "./Key";
import { KEY_LAYOUT } from "@/lib/input/key-mappings";
import { useTouchInput } from "@/lib/input/use-touch-input";

// White key semitone offsets within an octave
const WHITE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
// Black key semitone offsets and their position (index among white keys they sit between)
const BLACK_KEYS: { offset: number; afterWhite: number }[] = [
  { offset: 1, afterWhite: 0 }, // C#
  { offset: 3, afterWhite: 1 }, // D#
  { offset: 6, afterWhite: 3 }, // F#
  { offset: 8, afterWhite: 4 }, // G#
  { offset: 10, afterWhite: 5 }, // A#
];

// Reverse lookup: midi offset → keyboard shortcut label
function buildLabelMap(octaveBase: number): Map<number, string> {
  const map = new Map<number, string>();
  for (const [key, offset] of Object.entries(KEY_LAYOUT)) {
    map.set(octaveBase + offset, key.toUpperCase());
  }
  return map;
}

interface KeyboardProps {
  octaveBase: number;
  activeNotes: Set<number>;
  onNoteOn: (midi: number) => void;
  onNoteOff: (midi: number) => void;
}

export function Keyboard({
  octaveBase,
  activeNotes,
  onNoteOn,
  onNoteOff,
}: KeyboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labels = buildLabelMap(octaveBase);

  useTouchInput({
    containerRef,
    onNoteOn,
    onNoteOff,
    enabled: true,
  });

  // Build 2 octaves of white + black keys
  const whiteKeys: { midi: number; label?: string }[] = [];
  const blackKeys: { midi: number; label?: string; position: number }[] = [];

  for (let oct = 0; oct < 2; oct++) {
    const base = octaveBase + oct * 12;

    WHITE_OFFSETS.forEach((offset) => {
      const midi = base + offset;
      whiteKeys.push({ midi, label: labels.get(midi) });
    });

    BLACK_KEYS.forEach(({ offset, afterWhite }) => {
      const midi = base + offset;
      // Position = which white key index (global) this black key sits after
      const position = oct * 7 + afterWhite;
      blackKeys.push({ midi, label: labels.get(midi), position });
    });
  }

  const totalWhite = whiteKeys.length;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full touch-none select-none"
      onPointerDown={(e) => {
        const note = getNoteFromEvent(e);
        if (note !== null) {
          (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
          onNoteOn(note);
        }
      }}
      onPointerUp={(e) => {
        const note = getNoteFromEvent(e);
        if (note !== null) onNoteOff(note);
      }}
      onPointerLeave={(e) => {
        const note = getNoteFromEvent(e);
        if (note !== null) onNoteOff(note);
      }}
    >
      {/* White keys */}
      {whiteKeys.map(({ midi, label }) => (
        <Key
          key={midi}
          midi={midi}
          isBlack={false}
          isActive={activeNotes.has(midi)}
          label={label}
        />
      ))}

      {/* Black keys — positioned absolutely */}
      {blackKeys.map(({ midi, label, position }) => {
        const leftPercent = ((position + 1) / totalWhite) * 100;
        const widthPercent = 0.65 / totalWhite * 100;
        return (
          <div
            key={midi}
            className="absolute top-0 h-[60%] z-10"
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              transform: "translateX(-50%)",
            }}
          >
            <Key
              midi={midi}
              isBlack
              isActive={activeNotes.has(midi)}
              label={label}
            />
          </div>
        );
      })}
    </div>
  );
}

function getNoteFromEvent(e: React.PointerEvent): number | null {
  const target = e.target as HTMLElement;
  const noteAttr = target.closest("[data-note]")?.getAttribute("data-note");
  if (!noteAttr) return null;
  return parseInt(noteAttr, 10);
}
