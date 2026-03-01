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
      <span className="font-[family-name:var(--font-label)] text-[9px] uppercase tracking-[0.15em] text-chrome/50">
        Octave
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onOctaveDown}
          className="flex h-7 w-7 items-center justify-center rounded
            text-chrome/70 text-xs font-bold
            transition-colors hover:text-chrome active:bg-white/5"
          style={{
            background: "linear-gradient(to bottom, #3a3c42, #2a2c30)",
            border: "1px solid var(--panel-border)",
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
            text-chrome/70 text-xs font-bold
            transition-colors hover:text-chrome active:bg-white/5"
          style={{
            background: "linear-gradient(to bottom, #3a3c42, #2a2c30)",
            border: "1px solid var(--panel-border)",
          }}
          aria-label="Octave up"
        >
          +
        </button>
      </div>
    </div>
  );
}
