interface KeyLabelProps {
  label: string;
  isBlack: boolean;
}

export function KeyLabel({ label, isBlack }: KeyLabelProps) {
  return (
    <span
      className={`
        pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2
        text-[10px] font-mono uppercase opacity-40
        hidden [@media(hover:hover)]:block
        ${isBlack ? "text-chrome" : "text-body"}
      `}
    >
      {label}
    </span>
  );
}
