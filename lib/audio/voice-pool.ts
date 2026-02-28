import type { IVoice } from "./voice";

export type VoiceFactory = (
  ctx: AudioContext,
  midi: number,
  destination: AudioNode,
  velocity?: number
) => IVoice;

/**
 * Manages polyphony: tracks active voices, enforces max polyphony
 * with oldest-voice stealing.
 */
export class VoicePool {
  private voices: IVoice[] = [];

  constructor(
    private maxVoices: number = 12
  ) {}

  /** Add a voice. Steals oldest if at capacity. Returns the stolen voice (if any). */
  add(voice: IVoice): IVoice | null {
    let stolen: IVoice | null = null;

    if (this.voices.length >= this.maxVoices) {
      stolen = this.voices.shift()!;
      stolen.release();
    }

    this.voices.push(voice);
    return stolen;
  }

  /** Release and remove a voice by MIDI note. Returns true if found. */
  release(midi: number): boolean {
    const index = this.voices.findIndex((v) => v.midi === midi);
    if (index === -1) return false;

    const voice = this.voices[index];
    this.voices.splice(index, 1);
    voice.release();
    return true;
  }

  /** Release all active voices. */
  releaseAll(): void {
    for (const voice of this.voices) {
      voice.release();
    }
    this.voices = [];
  }

  /** Check if a note is currently active. */
  has(midi: number): boolean {
    return this.voices.some((v) => v.midi === midi);
  }

  /** Number of active voices. */
  get count(): number {
    return this.voices.length;
  }
}
