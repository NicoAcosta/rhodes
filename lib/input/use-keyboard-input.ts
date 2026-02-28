import { useEffect } from "react";
import { keyToMidiNote } from "./key-mappings";

interface UseKeyboardInputOptions {
  octaveBase: number;
  onNoteOn: (midi: number) => void;
  onNoteOff: (midi: number) => void;
  enabled: boolean;
}

export function useKeyboardInput({
  octaveBase,
  onNoteOn,
  onNoteOff,
  enabled,
}: UseKeyboardInputOptions) {
  useEffect(() => {
    if (!enabled) return;

    const held = new Set<string>();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const midi = keyToMidiNote(e.key, octaveBase);
      if (midi === null) return;

      e.preventDefault();
      const keyLower = e.key.toLowerCase();
      if (held.has(keyLower)) return;
      held.add(keyLower);
      onNoteOn(midi);
    }

    function handleKeyUp(e: KeyboardEvent) {
      const midi = keyToMidiNote(e.key, octaveBase);
      if (midi === null) return;

      e.preventDefault();
      const keyLower = e.key.toLowerCase();
      held.delete(keyLower);
      onNoteOff(midi);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      // Release all held notes on cleanup
      held.clear();
    };
  }, [octaveBase, onNoteOn, onNoteOff, enabled]);
}
