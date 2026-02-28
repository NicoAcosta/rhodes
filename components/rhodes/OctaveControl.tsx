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
    <div className="flex items-center gap-2">
      <button
        onClick={onOctaveDown}
        className="flex h-7 w-7 items-center justify-center rounded-full
          border border-chrome/30 text-chrome/70 text-sm font-bold
          transition-colors hover:border-accent hover:text-accent
          active:bg-accent/20"
        aria-label="Octave down"
      >
        &minus;
      </button>
      <span className="min-w-[70px] text-center text-[11px] tracking-wider text-accent font-mono">
        {low}&ndash;{high}
      </span>
      <button
        onClick={onOctaveUp}
        className="flex h-7 w-7 items-center justify-center rounded-full
          border border-chrome/30 text-chrome/70 text-sm font-bold
          transition-colors hover:border-accent hover:text-accent
          active:bg-accent/20"
        aria-label="Octave up"
      >
        +
      </button>
    </div>
  );
}
