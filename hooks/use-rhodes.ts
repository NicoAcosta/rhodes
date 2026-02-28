import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEngine } from "@/lib/audio/engine";
import { Voice } from "@/lib/audio/voice";
import { SampledVoice } from "@/lib/audio/samples/sampled-voice";
import {
  SampleManager,
  type SampleTier,
} from "@/lib/audio/samples/sample-manager";
import { useKeyboardInput } from "@/lib/input/use-keyboard-input";

const DEFAULT_OCTAVE_BASE = 48; // C3
const MIN_OCTAVE_BASE = 24; // C1
const MAX_OCTAVE_BASE = 72; // C5 (top of 2nd octave = C7)

export function useRhodes() {
  const engineRef = useRef<AudioEngine | null>(null);
  const sampleManagerRef = useRef<SampleManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [octaveBase, setOctaveBase] = useState(DEFAULT_OCTAVE_BASE);
  const [qualityTier, setQualityTier] = useState<SampleTier>("fm");

  // Controls
  const [volume, setVolume] = useState(0.7);
  const [tremoloRate, setTremoloRate] = useState(0);
  const [tremoloDepth, setTremoloDepth] = useState(0);
  const [tone, setTone] = useState(0.5);
  const [chorusMix, setChorusMix] = useState(0);

  // Initialize engine on first user interaction
  const init = useCallback(async () => {
    if (engineRef.current?.isReady) return;

    if (!engineRef.current) {
      // Dynamic factory: prefer sampled voice, fall back to FM
      const factory = (
        ctx: AudioContext,
        midi: number,
        dest: AudioNode,
        velocity?: number
      ) => {
        const sample = sampleManagerRef.current?.lookup(midi, velocity);
        if (sample) {
          return new SampledVoice(
            ctx,
            midi,
            dest,
            sample.buffer,
            sample.playbackRate,
            velocity
          );
        }
        return new Voice(ctx, midi, dest, undefined, velocity);
      };

      engineRef.current = new AudioEngine(factory);
    }

    await engineRef.current.init();
    // Apply current control values
    engineRef.current.setVolume(volume);
    engineRef.current.setTremoloRate(tremoloRate);
    engineRef.current.setTremoloDepth(tremoloDepth);
    engineRef.current.setTone(tone);
    engineRef.current.setChorusMix(chorusMix);
    setIsReady(true);

    // Start loading samples in background
    const ctx = engineRef.current.context;
    if (ctx && !sampleManagerRef.current) {
      const mgr = new SampleManager(ctx);
      sampleManagerRef.current = mgr;
      mgr.onTierChange = setQualityTier;

      mgr.loadTier1().then(() => mgr.loadTier2());
    }
  }, [volume, tremoloRate, tremoloDepth, tone, chorusMix]);

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

  useEffect(() => {
    engineRef.current?.setChorusMix(chorusMix);
  }, [chorusMix]);

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
      sampleManagerRef.current?.dispose();
      engineRef.current?.dispose();
    };
  }, []);

  return {
    isReady,
    activeNotes,
    octaveBase,
    qualityTier,
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
    chorusMix,
    setChorusMix,
    octaveUp,
    octaveDown,
  };
}
