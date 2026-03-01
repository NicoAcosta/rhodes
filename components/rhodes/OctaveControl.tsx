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
        className="flex h-6 w-6 items-center justify-center rounded-full
          border border-chrome/20 text-chrome/60 text-xs font-bold
          transition-colors hover:border-accent hover:text-accent
          active:bg-accent/10"
        aria-label="Octave down"
      >
        &minus;
      </button>
      <span className="min-w-[65px] text-center font-[family-name:var(--font-jetbrains)] text-[10px] tracking-wider text-accent">
        {low}&ndash;{high}
      </span>
      <button
        onClick={onOctaveUp}
        className="flex h-6 w-6 items-center justify-center rounded-full
          border border-chrome/20 text-chrome/60 text-xs font-bold
          transition-colors hover:border-accent hover:text-accent
          active:bg-accent/10"
        aria-label="Octave up"
      >
        +
      </button>
    </div>
  );
}
