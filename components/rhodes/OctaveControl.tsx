import { midiToNoteName } from "@/lib/music/notes";

interface OctaveControlProps {
  octaveBase: number;
  onOctaveUp: () => void;
  onOctaveDown: () => void;
}

export function OctaveControl({
  octaveBase,
  onOctaveUp,
  onOctaveDown,
}: OctaveControlProps) {
  const low = midiToNoteName(octaveBase);
  const high = midiToNoteName(octaveBase + 23);

  return (
    <div className="section-panel flex flex-col gap-1.5 px-3 py-2">
      <span
        className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.15em]"
        style={{ color: "var(--section-title)" }}
      >
        Octave
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onOctaveDown}
          className="flex h-7 w-7 items-center justify-center rounded
            text-xs font-bold
            transition-all hover:brightness-110 active:brightness-95"
          style={{
            background: "linear-gradient(to bottom, #b8bcc4, #a0a4ac)",
            border: "1px solid #909498",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
            color: "var(--section-title)",
          }}
          aria-label="Octave down"
        >
          &minus;
        </button>
        <div className="recessed-display px-2.5 py-1">
          <span className="min-w-[60px] text-center font-[family-name:var(--font-jetbrains)] text-[10px] tracking-wider text-accent">
            {low}&ndash;{high}
          </span>
        </div>
        <button
          onClick={onOctaveUp}
          className="flex h-7 w-7 items-center justify-center rounded
            text-xs font-bold
            transition-all hover:brightness-110 active:brightness-95"
          style={{
            background: "linear-gradient(to bottom, #b8bcc4, #a0a4ac)",
            border: "1px solid #909498",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
            color: "var(--section-title)",
          }}
          aria-label="Octave up"
        >
          +
        </button>
      </div>
    </div>
  );
}
