import { useCallback, useId, useRef } from "react";

interface KnobProps {
  label: string;
  value: number; // 0–1
  onChange: (value: number) => void;
}

const MIN_ANGLE = -135;
const MAX_ANGLE = 135;
const DRAG_SENSITIVITY = 200; // pixels for full range
const CENTER = 28;
const OUTER_R = 24;
const CAP_R = 16;
const ARC_R = 21;

function describeArc(angle: number): string {
  const startAngle = MIN_ANGLE;
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((angle - 90) * Math.PI) / 180;
  const x1 = CENTER + ARC_R * Math.cos(startRad);
  const y1 = CENTER + ARC_R * Math.sin(startRad);
  const x2 = CENTER + ARC_R * Math.cos(endRad);
  const y2 = CENTER + ARC_R * Math.sin(endRad);
  const largeArc = angle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${ARC_R} ${ARC_R} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export function Knob({ label, value, onChange }: KnobProps) {
  const ids = useId();
  const capGradId = `cap-${ids}`;
  const knurlId = `knurl-${ids}`;
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

  // Indicator notch position
  const notchRad = ((angle - 90) * Math.PI) / 180;
  const notchInner = 8;
  const notchOuter = 14;
  const nx1 = CENTER + notchInner * Math.cos(notchRad);
  const ny1 = CENTER + notchInner * Math.sin(notchRad);
  const nx2 = CENTER + notchOuter * Math.cos(notchRad);
  const ny2 = CENTER + notchOuter * Math.sin(notchRad);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        className="cursor-grab active:cursor-grabbing"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          {/* Knurled outer ring pattern */}
          <pattern id={knurlId} width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="#252220" />
            <rect width="1" height="3" fill="#1a1816" />
          </pattern>
          {/* Chrome cap gradient */}
          <radialGradient id={capGradId} cx="38%" cy="32%">
            <stop offset="0%" stopColor="#e8e4dc" />
            <stop offset="50%" stopColor="#c8c4bc" />
            <stop offset="100%" stopColor="#78746c" />
          </radialGradient>
        </defs>

        {/* Position arc (background track) */}
        <path
          d={describeArc(MAX_ANGLE)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Position arc (value) */}
        {value > 0.01 && (
          <path
            d={describeArc(angle)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
        )}

        {/* Outer knurled ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_R}
          fill={`url(#${knurlId})`}
          stroke="#1a1816"
          strokeWidth="1"
        />

        {/* Chrome cap */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={CAP_R}
          fill={`url(#${capGradId})`}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="0.5"
        />

        {/* Specular highlight on cap */}
        <ellipse
          cx={CENTER - 3}
          cy={CENTER - 4}
          rx="6"
          ry="4"
          fill="rgba(255,255,255,0.15)"
        />

        {/* Indicator notch */}
        <line
          x1={nx1}
          y1={ny1}
          x2={nx2}
          y2={ny2}
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.12em] text-chrome/50">
        {label}
      </span>
    </div>
  );
}
