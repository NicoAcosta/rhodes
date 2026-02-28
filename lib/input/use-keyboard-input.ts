import { useEffect } from "react";
import { codeToMidiNote } from "./key-mappings";

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

      const midi = codeToMidiNote(e.code, octaveBase);
      if (midi === null) return;

      e.preventDefault();
      if (held.has(e.code)) return;
      held.add(e.code);
      onNoteOn(midi);
    }

    function handleKeyUp(e: KeyboardEvent) {
      const midi = codeToMidiNote(e.code, octaveBase);
      if (midi === null) return;

      e.preventDefault();
      held.delete(e.code);
      onNoteOff(midi);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      held.clear();
    };
  }, [octaveBase, onNoteOn, onNoteOff, enabled]);
}
