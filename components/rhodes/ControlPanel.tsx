import type { SampleTier } from "@/lib/audio/samples/sample-manager";
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
          className="font-[family-name:var(--font-playfair)] text-[11px] font-semibold tracking-[0.3em] text-accent"
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
        className="flex items-center justify-between px-4 py-3
          landscape:max-h-[80px]"
        style={{
          background: "linear-gradient(to bottom, var(--panel), #1e1b18)",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Knobs */}
        <div className="flex items-center gap-5 sm:gap-8">
          <Knob label="Volume" value={volume} onChange={onVolumeChange} />
          <Knob
            label="Trem Rate"
            value={tremoloRate / 8}
            onChange={(v) => onTremoloRateChange(v * 8)}
          />
          <Knob
            label="Trem Depth"
            value={tremoloDepth}
            onChange={onTremoloDepthChange}
          />
          <Knob label="Tone" value={tone} onChange={onToneChange} />
          <Knob label="Chorus" value={chorusMix} onChange={onChorusMixChange} />
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
