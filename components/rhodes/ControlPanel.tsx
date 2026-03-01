import type { SampleTier } from "@/lib/audio/samples/sample-manager";
import type { ReactNode } from "react";
import { Knob } from "./Knob";
import { OctaveControl } from "./OctaveControl";
import { QualityIndicator } from "./QualityIndicator";

interface ControlPanelProps {
  volume: number;
  onVolumeChange: (v: number) => void;
  tremoloRate: number;
  onTremoloRateChange: (v: number) => void;
  tremoloDepth: number;
  onTremoloDepthChange: (v: number) => void;
  tone: number;
  onToneChange: (v: number) => void;
  chorusMix: number;
  onChorusMixChange: (v: number) => void;
  octaveBase: number;
  onOctaveUp: () => void;
  onOctaveDown: () => void;
  qualityTier: SampleTier;
}

function EffectSection({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div className="section-panel flex flex-col gap-2 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: active ? "var(--led)" : "var(--led-off)",
            border: active ? "1px solid rgba(212, 160, 32, 0.6)" : "1px solid rgba(0,0,0,0.2)",
            boxShadow: active
              ? "0 0 4px var(--led), 0 0 8px var(--accent-glow)"
              : "inset 0 1px 2px rgba(0,0,0,0.3)",
            flexShrink: 0,
          }}
        />
        <span
          className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: "var(--section-title)" }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-4">{children}</div>
    </div>
  );
}

export function ControlPanel({
  volume,
  onVolumeChange,
  tremoloRate,
  onTremoloRateChange,
  tremoloDepth,
  onTremoloDepthChange,
  tone,
  onToneChange,
  chorusMix,
  onChorusMixChange,
  octaveBase,
  onOctaveUp,
  onOctaveDown,
  qualityTier,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col">
      {/* Namerail — leather with chrome title plate */}
      <div
        className="leather-texture flex h-10 items-center justify-between px-4"
        style={{ backgroundColor: "var(--namerail)" }}
      >
        <div className="title-plate px-4 py-0.5">
          <div
            className="font-[family-name:var(--font-playfair)] text-[11px] font-semibold tracking-[0.3em]"
            style={{
              fontVariant: "small-caps",
              color: "#1a1c22",
              textShadow: "0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            RHODES
          </div>
        </div>
        <QualityIndicator tier={qualityTier} />
      </div>

      {/* Chrome grill stripe */}
      <div className="chrome-grill h-5 w-full" />

      {/* Controls area */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3
          landscape:max-h-[80px]"
        style={{
          background: "linear-gradient(to bottom, #1e2024, #1a1c20)",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Effect sections */}
        <div className="flex items-start gap-3">
          <EffectSection label="EQ" active>
            <Knob label="Volume" value={volume} onChange={onVolumeChange} />
            <Knob label="Tone" value={tone} onChange={onToneChange} />
          </EffectSection>

          <EffectSection label="Tremolo" active={tremoloDepth > 0}>
            <Knob
              label="Rate"
              value={tremoloRate / 8}
              onChange={(v) => onTremoloRateChange(v * 8)}
            />
            <Knob
              label="Depth"
              value={tremoloDepth}
              onChange={onTremoloDepthChange}
            />
          </EffectSection>

          <EffectSection label="Chorus" active={chorusMix > 0}>
            <Knob label="Mix" value={chorusMix} onChange={onChorusMixChange} />
          </EffectSection>
        </div>

        {/* Octave */}
        <OctaveControl
          octaveBase={octaveBase}
          onOctaveUp={onOctaveUp}
          onOctaveDown={onOctaveDown}
        />
      </div>
    </div>
  );
}
