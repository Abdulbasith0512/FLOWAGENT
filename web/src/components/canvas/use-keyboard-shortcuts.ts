import { useEffect } from "react";

export interface ShortcutHandlers {
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
  onDeselect: () => void;
  onFitView: () => void;
  onCommandPalette: () => void;
  onSearch: () => void;
  onRun?: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod && key === "k") {
        event.preventDefault();
        handlers.onCommandPalette();
        return;
      }

      if (mod && key === "f") {
        event.preventDefault();
        handlers.onSearch();
        return;
      }

      if (isTypingTarget(event.target)) return;

      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) handlers.onRedo();
        else handlers.onUndo();
        return;
      }

      if (mod && key === "c") {
        event.preventDefault();
        handlers.onCopy();
        return;
      }

      if (mod && key === "v") {
        event.preventDefault();
        handlers.onPaste();
        return;
      }

      if (mod && key === "d") {
        event.preventDefault();
        handlers.onDuplicate();
        return;
      }

      if (mod && key === "a") {
        event.preventDefault();
        handlers.onSelectAll();
        return;
      }

      if (mod && key === "enter") {
        event.preventDefault();
        handlers.onRun?.();
        return;
      }

      if (key === "delete" || key === "backspace") {
        event.preventDefault();
        handlers.onDelete();
        return;
      }

      if (key === "escape") {
        handlers.onDeselect();
        return;
      }

      if (event.shiftKey && key === "!") {
        event.preventDefault();
        handlers.onFitView();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
