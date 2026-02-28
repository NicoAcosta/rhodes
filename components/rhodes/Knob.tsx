import { useCallback, useId, useRef } from "react";

interface KnobProps {
  label: string;
  value: number; // 0–1
  onChange: (value: number) => void;
}

const MIN_ANGLE = -135;
const MAX_ANGLE = 135;
const DRAG_SENSITIVITY = 200; // pixels for full range

export function Knob({ label, value, onChange }: KnobProps) {
  const gradId = useId();
  const dragStartRef = useRef<{ y: number; startValue: number } | null>(null);

  const angle = MIN_ANGLE + value * (MAX_ANGLE - MIN_ANGLE);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragStartRef.current = { y: e.clientY, startValue: value };
    },
    [value]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStartRef.current) return;
      const dy = dragStartRef.current.y - e.clientY;
      const newValue = Math.max(
        0,
        Math.min(1, dragStartRef.current.startValue + dy / DRAG_SENSITIVITY)
      );
      onChange(newValue);
    },
    [onChange]
  );

  const handlePointerUp = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        className="cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Outer ring */}
        <circle cx="24" cy="24" r="20" fill="#2a2520" stroke="#555" strokeWidth="1" />
        {/* Chrome cap */}
        <circle cx="24" cy="24" r="14" fill={`url(#${gradId})`} />
        {/* Indicator line */}
        <line
          x1="24"
          y1="24"
          x2="24"
          y2="10"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${angle} 24 24)`}
        />
        {/* Gradient definition */}
        <defs>
          <radialGradient id={gradId} cx="40%" cy="35%">
            <stop offset="0%" stopColor="#e0e0e0" />
            <stop offset="100%" stopColor="#888" />
          </radialGradient>
        </defs>
      </svg>
      <span className="text-[10px] uppercase tracking-wider text-chrome/60">
        {label}
      </span>
    </div>
  );
}
