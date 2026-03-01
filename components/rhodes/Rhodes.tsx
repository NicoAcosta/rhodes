"use client";

import { useRhodes } from "@/hooks/use-rhodes";
import { Keyboard } from "./Keyboard";
import { ControlPanel } from "./ControlPanel";

export function Rhodes() {
  const rhodes = useRhodes();

  return (
    <div
      className="tolex flex h-dvh w-dvw flex-col overflow-hidden"
      style={{ backgroundColor: "var(--body)" }}
      onPointerDown={() => {
        if (!rhodes.isReady) rhodes.init();
      }}
    >
      {/* Init overlay */}
      {!rhodes.isReady && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(40,35,28,0.95) 0%, rgba(15,15,15,0.97) 70%)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="font-[family-name:var(--font-playfair)] text-3xl font-semibold tracking-[0.15em] text-accent"
            >
              RHODES
            </div>
            <div className="font-[family-name:var(--font-jetbrains)] animate-pulse text-xs tracking-wider text-chrome/50">
              Tap or press any key to start
            </div>
          </div>
        </div>
      )}

      {/* Chrome top trim */}
      <div className="chrome-trim h-[3px] w-full" />

      {/* Namerail + Control Panel */}
      <ControlPanel
        volume={rhodes.volume}
        onVolumeChange={rhodes.setVolume}
        tremoloRate={rhodes.tremoloRate}
        onTremoloRateChange={rhodes.setTremoloRate}
        tremoloDepth={rhodes.tremoloDepth}
        onTremoloDepthChange={rhodes.setTremoloDepth}
        tone={rhodes.tone}
        onToneChange={rhodes.setTone}
        chorusMix={rhodes.chorusMix}
        onChorusMixChange={rhodes.setChorusMix}
        octaveBase={rhodes.octaveBase}
        onOctaveUp={rhodes.octaveUp}
        onOctaveDown={rhodes.octaveDown}
        qualityTier={rhodes.qualityTier}
      />

      {/* Chrome mid trim */}
      <div className="chrome-trim h-[2px] w-full" />

      {/* Keyboard */}
      <div className="flex-1 min-h-0 px-3 py-2 pb-3">
        <Keyboard
          octaveBase={rhodes.octaveBase}
          activeNotes={rhodes.activeNotes}
          onNoteOn={rhodes.noteOn}
          onNoteOff={rhodes.noteOff}
        />
      </div>

      {/* Chrome bottom trim */}
      <div className="chrome-trim h-[3px] w-full" />
    </div>
  );
}
