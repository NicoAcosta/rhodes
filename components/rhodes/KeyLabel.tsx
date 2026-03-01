interface KeyLabelProps {
  label: string;
  isBlack: boolean;
}

export function KeyLabel({ label, isBlack }: KeyLabelProps) {
  return (
    <span
      className={`
        pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2
        font-[family-name:var(--font-jetbrains)] text-[9px] uppercase opacity-35
        hidden [@media(hover:hover)]:block
        ${isBlack ? "text-chrome" : "text-body"}
      `}
    >
      {label}
    </span>
  );
}
