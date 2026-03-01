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
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: active ? "var(--led)" : "var(--led-off)",
            boxShadow: active
              ? "0 0 4px var(--led), 0 0 8px var(--accent-glow)"
              : undefined,
            flexShrink: 0,
          }}
        />
        <span className="font-[family-name:var(--font-label)] text-[9px] uppercase tracking-[0.15em] text-chrome/50">
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
      {/* Namerail */}
      <div
        className="brushed-metal flex h-8 items-center justify-between px-4"
        style={{ backgroundColor: "var(--namerail)" }}
      >
        <div
          className="font-[family-name:var(--font-playfair)] text-[11px] font-semibold tracking-[0.3em] text-chrome"
          style={{ fontVariant: "small-caps" }}
        >
          RHODES
        </div>
        <QualityIndicator tier={qualityTier} />
      </div>

      {/* Inset border between namerail and controls */}
      <div className="h-px w-full bg-black/40" />

      {/* Controls area */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3
          landscape:max-h-[80px]"
        style={{
          background: "linear-gradient(to bottom, var(--panel), #131416)",
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
