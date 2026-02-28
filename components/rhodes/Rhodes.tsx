"use client";

import { useRhodes } from "@/hooks/use-rhodes";
import { Keyboard } from "./Keyboard";
import { ControlPanel } from "./ControlPanel";

export function Rhodes() {
  const rhodes = useRhodes();

  return (
    <div
      className="flex h-dvh w-dvw flex-col bg-body overflow-hidden"
      onPointerDown={() => {
        if (!rhodes.isReady) rhodes.init();
      }}
    >
      {/* Init overlay */}
      {!rhodes.isReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-body/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="text-2xl font-light tracking-widest text-chrome">
              RHODES KEYS
            </div>
            <div className="animate-pulse text-sm text-accent">
              Tap or press any key to start
            </div>
          </div>
        </div>
      )}

      {/* Chrome top trim */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-chrome/40 to-transparent" />

      {/* Control Panel */}
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
      />

      {/* Chrome mid trim */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-chrome/30 to-transparent" />

      {/* Keyboard */}
      <div className="flex-1 min-h-0 p-2 pb-3">
        <Keyboard
          octaveBase={rhodes.octaveBase}
          activeNotes={rhodes.activeNotes}
          onNoteOn={rhodes.noteOn}
          onNoteOff={rhodes.noteOff}
        />
      </div>

      {/* Chrome bottom trim */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-chrome/40 to-transparent" />
    </div>
  );
}
