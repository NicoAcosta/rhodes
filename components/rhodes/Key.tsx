import { KeyLabel } from "./KeyLabel";

interface KeyProps {
  midi: number;
  isBlack: boolean;
  isActive: boolean;
  label?: string;
}

export function Key({ midi, isBlack, isActive, label }: KeyProps) {
  if (isBlack) {
    return (
      <div
        data-note={midi}
        className={`
          h-full w-full cursor-pointer rounded-b-md
          border border-neutral-700
          transition-transform duration-75
          ${
            isActive
              ? "translate-y-[2px] bg-neutral-600 shadow-inner"
              : "bg-key-black shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
          }
        `}
      >
        {label && <KeyLabel label={label} isBlack />}
      </div>
    );
  }

  return (
    <div
      data-note={midi}
      className={`
        relative flex-1 cursor-pointer rounded-b-lg
        border-x border-b border-neutral-300
        transition-transform duration-75
        ${
          isActive
            ? "translate-y-[2px] bg-[#e8e3d8] shadow-inner"
            : "bg-key-white shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
        }
      `}
    >
      {label && <KeyLabel label={label} isBlack={false} />}
    </div>
  );
}
