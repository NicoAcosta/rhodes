import { Knob } from "./Knob";
import { OctaveControl } from "./OctaveControl";

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
}: ControlPanelProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2
        bg-gradient-to-b from-panel to-[#342e28]
        landscape:max-h-[80px]"
    >
      {/* Knobs */}
      <div className="flex items-center gap-4 sm:gap-6">
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
  );
}
