import { useEffect, useRef } from "react";

interface UseTouchInputOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  onNoteOn: (midi: number) => void;
  onNoteOff: (midi: number) => void;
  enabled: boolean;
}

function getNoteFromPoint(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const noteEl = el.closest("[data-note]");
  if (!noteEl) return null;
  return parseInt(noteEl.getAttribute("data-note")!, 10);
}

/**
 * Multi-touch input handler. Tracks each finger independently.
 * Sliding between keys triggers noteOff/noteOn for glissando.
 */
export function useTouchInput({
  containerRef,
  onNoteOn,
  onNoteOff,
  enabled,
}: UseTouchInputOptions) {
  // Map: touch identifier → currently held MIDI note
  const touchMap = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    function handleTouchStart(e: TouchEvent) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const note = getNoteFromPoint(touch.clientX, touch.clientY);
        if (note !== null) {
          touchMap.current.set(touch.identifier, note);
          onNoteOn(note);
        }
      }
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const newNote = getNoteFromPoint(touch.clientX, touch.clientY);
        const oldNote = touchMap.current.get(touch.identifier);

        if (newNote !== oldNote) {
          if (oldNote !== undefined) {
            onNoteOff(oldNote);
          }
          if (newNote !== null) {
            touchMap.current.set(touch.identifier, newNote);
            onNoteOn(newNote);
          } else {
            touchMap.current.delete(touch.identifier);
          }
        }
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const note = touchMap.current.get(touch.identifier);
        if (note !== undefined) {
          onNoteOff(note);
          touchMap.current.delete(touch.identifier);
        }
      }
    }

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: false });
    container.addEventListener("touchcancel", handleTouchEnd, {
      passive: false,
    });

    const currentTouchMap = touchMap.current;

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
      // Release all on cleanup
      for (const note of currentTouchMap.values()) {
        onNoteOff(note);
      }
      currentTouchMap.clear();
    };
  }, [containerRef, onNoteOn, onNoteOff, enabled]);
}
