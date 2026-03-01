import { useCallback, useId, useRef } from "react";

interface KnobProps {
  label: string;
  value: number; // 0–1
  onChange: (value: number) => void;
}

const MIN_ANGLE = -135;
const MAX_ANGLE = 135;
const DRAG_SENSITIVITY = 200;
const CENTER = 40;
const OUTER_R = 32;
const KNURL_R = 28;
const CAP_R = 20;
const TICK_COUNT = 21;
const TICK_INNER = 34;
const TICK_OUTER = 38;

function generateTicks(value: number) {
  const ticks: { x1: number; y1: number; x2: number; y2: number; active: boolean }[] = [];
  for (let i = 0; i < TICK_COUNT; i++) {
    const t = i / (TICK_COUNT - 1);
    const angle = MIN_ANGLE + t * (MAX_ANGLE - MIN_ANGLE);
    const rad = ((angle - 90) * Math.PI) / 180;
    ticks.push({
      x1: CENTER + TICK_INNER * Math.cos(rad),
      y1: CENTER + TICK_INNER * Math.sin(rad),
      x2: CENTER + TICK_OUTER * Math.cos(rad),
      y2: CENTER + TICK_OUTER * Math.sin(rad),
      active: t <= value,
    });
  }
  return ticks;
}

export function Knob({ label, value, onChange }: KnobProps) {
  const ids = useId();
  const capGradId = `cap-${ids}`;
  const ringGradId = `ring-${ids}`;
  const knurlId = `knurl-${ids}`;
  const shadowId = `shadow-${ids}`;
  const dragStartRef = useRef<{ y: number; startValue: number } | null>(null);

  const angle = MIN_ANGLE + value * (MAX_ANGLE - MIN_ANGLE);
  const ticks = generateTicks(value);

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
  const notchInner = 10;
  const notchOuter = 18;
  const nx1 = CENTER + notchInner * Math.cos(notchRad);
  const ny1 = CENTER + notchInner * Math.sin(notchRad);
  const nx2 = CENTER + notchOuter * Math.cos(notchRad);
  const ny2 = CENTER + notchOuter * Math.sin(notchRad);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        className="cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          {/* Ambient shadow */}
          <radialGradient id={shadowId}>
            <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          {/* Silver outer ring gradient - top-to-bottom bevel */}
          <linearGradient id={ringGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8eaee" />
            <stop offset="25%" stopColor="#b0b3b8" />
            <stop offset="50%" stopColor="#8a8d94" />
            <stop offset="75%" stopColor="#b0b3b8" />
            <stop offset="100%" stopColor="#d0d2d6" />
          </linearGradient>
          {/* Knurled grip pattern */}
          <pattern id={knurlId} width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill="#28292e" />
            <rect width="1" height="2" fill="#1e1f24" />
          </pattern>
          {/* Chrome cap gradient */}
          <radialGradient id={capGradId} cx="38%" cy="32%">
            <stop offset="0%" stopColor="#e2e4e8" />
            <stop offset="50%" stopColor="#c0c2c8" />
            <stop offset="100%" stopColor="#6b6e74" />
          </radialGradient>
        </defs>

        {/* Ambient shadow below knob */}
        <ellipse
          cx={CENTER}
          cy={CENTER + 2}
          rx="30"
          ry="28"
          fill={`url(#${shadowId})`}
        />

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}

        {/* Outer silver beveled ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_R}
          fill={`url(#${ringGradId})`}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="0.5"
        />

        {/* Inner bevel highlight */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_R - 0.5}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.5"
        />

        {/* Knurled grip area */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={KNURL_R}
          fill={`url(#${knurlId})`}
          stroke="#1a1b1e"
          strokeWidth="0.5"
        />

        {/* Chrome cap */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={CAP_R}
          fill={`url(#${capGradId})`}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="0.5"
        />

        {/* Specular highlight on cap */}
        <ellipse
          cx={CENTER - 4}
          cy={CENTER - 5}
          rx="8"
          ry="5"
          fill="rgba(255,255,255,0.18)"
        />

        {/* White indicator notch */}
        <line
          x1={nx1}
          y1={ny1}
          x2={nx2}
          y2={ny2}
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-[0.15em] text-chrome/60">
        {label}
      </span>
    </div>
  );
}
