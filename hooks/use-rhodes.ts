import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEngine } from "@/lib/audio/engine";
import { useKeyboardInput } from "@/lib/input/use-keyboard-input";

const DEFAULT_OCTAVE_BASE = 48; // C3
const MIN_OCTAVE_BASE = 24; // C1
const MAX_OCTAVE_BASE = 72; // C5 (top of 2nd octave = C7)

export function useRhodes() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [octaveBase, setOctaveBase] = useState(DEFAULT_OCTAVE_BASE);

  // Controls
  const [volume, setVolume] = useState(0.7);
  const [tremoloRate, setTremoloRate] = useState(0);
  const [tremoloDepth, setTremoloDepth] = useState(0);
  const [tone, setTone] = useState(0.5);

  // Initialize engine on first user interaction
  const init = useCallback(async () => {
    if (engineRef.current?.isReady) return;

    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
    }

    await engineRef.current.init();
    // Apply current control values
    engineRef.current.setVolume(volume);
    engineRef.current.setTremoloRate(tremoloRate);
    engineRef.current.setTremoloDepth(tremoloDepth);
    engineRef.current.setTone(tone);
    setIsReady(true);
  }, [volume, tremoloRate, tremoloDepth, tone]);

  // Sync controls to engine
  useEffect(() => {
    engineRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    engineRef.current?.setTremoloRate(tremoloRate);
  }, [tremoloRate]);

  useEffect(() => {
    engineRef.current?.setTremoloDepth(tremoloDepth);
  }, [tremoloDepth]);

  useEffect(() => {
    engineRef.current?.setTone(tone);
  }, [tone]);

  // Note handlers — imperative audio, React state for visuals
  const noteOn = useCallback(
    async (midi: number) => {
      if (!engineRef.current?.isReady) {
        await init();
      }
      engineRef.current?.noteOn(midi);
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.add(midi);
        return next;
      });
    },
    [init]
  );

  const noteOff = useCallback((midi: number) => {
    engineRef.current?.noteOff(midi);
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
  }, []);

  const octaveUp = useCallback(() => {
    engineRef.current?.releaseAll();
    setActiveNotes(new Set());
    setOctaveBase((prev) => Math.min(prev + 12, MAX_OCTAVE_BASE));
  }, []);

  const octaveDown = useCallback(() => {
    engineRef.current?.releaseAll();
    setActiveNotes(new Set());
    setOctaveBase((prev) => Math.max(prev - 12, MIN_OCTAVE_BASE));
  }, []);

  // Desktop keyboard input
  useKeyboardInput({
    octaveBase,
    onNoteOn: noteOn,
    onNoteOff: noteOff,
    enabled: true,
  });

  // Cleanup
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
    };
  }, []);

  return {
    isReady,
    activeNotes,
    octaveBase,
    noteOn,
    noteOff,
    init,
    // Controls
    volume,
    setVolume,
    tremoloRate,
    setTremoloRate,
    tremoloDepth,
    setTremoloDepth,
    tone,
    setTone,
    octaveUp,
    octaveDown,
  };
}
