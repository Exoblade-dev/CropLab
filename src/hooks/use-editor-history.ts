import { useCallback, useState } from 'react';
import type { CropState } from '@/types/editor';

const MAX_HISTORY = 50;

export function useEditorHistory() {
  const [undoStack, setUndoStack] = useState<CropState[]>([]);
  const [redoStack, setRedoStack] = useState<CropState[]>([]);

  const saveState = useCallback((state: CropState) => {
    setUndoStack((prev) => {
      const next = [...prev, state];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    setRedoStack([]);
  }, []);

  const resetHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const undo = useCallback((current: CropState) => {
    if (!undoStack.length) return null;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [current, ...prev].slice(0, MAX_HISTORY));
    setUndoStack((prev) => prev.slice(0, -1));
    return previous;
  }, [undoStack]);

  const redo = useCallback((current: CropState) => {
    if (!redoStack.length) return null;
    const next = redoStack[0];
    setUndoStack((prev) => [...prev, current].slice(-MAX_HISTORY));
    setRedoStack((prev) => prev.slice(1));
    return next;
  }, [redoStack]);

  return { undoStack, redoStack, saveState, resetHistory, undo, redo };
}
