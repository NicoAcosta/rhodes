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
          transition-transform duration-75
        `}
        style={
          isActive
            ? {
                background: "linear-gradient(to bottom, #333, #222)",
                boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.5)",
                transform: "translateY(2px)",
              }
            : {
                background: "linear-gradient(to bottom, #222, #111)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 6px rgba(0,0,0,0.6)",
                border: "1px solid #0a0a0a",
              }
        }
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
        transition-transform duration-75
      `}
      style={
        isActive
          ? {
              background: "linear-gradient(to bottom, #ece7dc, #e2ddd2)",
              boxShadow:
                "inset 0 2px 6px rgba(180, 160, 100, 0.2), inset 0 0 0 1px rgba(0,0,0,0.05)",
              transform: "translateY(2px)",
            }
          : {
              background: "linear-gradient(to bottom, #f8f4eb, #ede8dd)",
              border: "1px solid #d5d0c5",
              boxShadow:
                "1px 0 0 rgba(0,0,0,0.06), -1px 0 0 rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.2)",
            }
      }
    >
      {label && <KeyLabel label={label} isBlack={false} />}
    </div>
  );
}
