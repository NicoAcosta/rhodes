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
  const notchShadowId = `notch-shadow-${ids}`;
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
          {/* Ambient shadow — deeper */}
          <radialGradient id={shadowId}>
            <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          {/* Silver outer ring gradient — 7 stops for richer chrome */}
          <linearGradient id={ringGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0f1f4" />
            <stop offset="15%" stopColor="#c0c3c8" />
            <stop offset="35%" stopColor="#808590" />
            <stop offset="50%" stopColor="#a0a3a8" />
            <stop offset="65%" stopColor="#808590" />
            <stop offset="85%" stopColor="#c0c3c8" />
            <stop offset="100%" stopColor="#f0f1f4" />
          </linearGradient>
          {/* Knurled grip pattern — diagonal checkerboard */}
          <pattern id={knurlId} width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill="#28292e" />
            <rect x="0" y="0" width="1" height="1" fill="#1e1f24" />
            <rect x="1" y="1" width="1" height="1" fill="#1e1f24" />
          </pattern>
          {/* Chrome cap gradient — brighter highlight, deeper shadow */}
          <radialGradient id={capGradId} cx="35%" cy="30%">
            <stop offset="0%" stopColor="#f2f3f6" />
            <stop offset="40%" stopColor="#d0d2d8" />
            <stop offset="70%" stopColor="#a0a2a8" />
            <stop offset="100%" stopColor="#606368" />
          </radialGradient>
          {/* Drop shadow filter for indicator notch */}
          <filter id={notchShadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(0,0,0,0.5)" />
          </filter>
        </defs>

        {/* Ambient shadow below knob — larger */}
        <ellipse
          cx={CENTER}
          cy={CENTER + 3}
          rx="33"
          ry="30"
          fill={`url(#${shadowId})`}
        />

        {/* Tick marks — dark on light */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.active ? "rgba(60,62,70,0.9)" : "rgba(60,62,70,0.3)"}
            strokeWidth="1.8"
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
          strokeWidth="0.8"
        />

        {/* Chrome lip ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_R - 2}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
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
          strokeWidth="0.8"
        />

        {/* Knurl inset shadow ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={KNURL_R - 0.5}
          fill="none"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="0.5"
        />

        {/* Chrome cap */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={CAP_R}
          fill={`url(#${capGradId})`}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="0.6"
        />

        {/* Cap edge highlight ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={CAP_R - 0.5}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.4"
        />

        {/* Primary specular highlight on cap — larger */}
        <ellipse
          cx={CENTER - 4}
          cy={CENTER - 5}
          rx="9"
          ry="5"
          fill="rgba(255,255,255,0.25)"
        />

        {/* Secondary specular glint — lower right */}
        <ellipse
          cx={CENTER + 5}
          cy={CENTER + 4}
          rx="4"
          ry="2.5"
          fill="rgba(255,255,255,0.08)"
        />

        {/* White indicator notch with drop shadow */}
        <line
          x1={nx1}
          y1={ny1}
          x2={nx2}
          y2={ny2}
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
          filter={`url(#${notchShadowId})`}
        />
      </svg>
      <span
        className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-[0.15em]"
        style={{ color: "var(--label-dark)" }}
      >
        {label}
      </span>
    </div>
  );
}
