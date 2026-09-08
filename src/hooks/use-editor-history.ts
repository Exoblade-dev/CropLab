import { useCallback, useState } from 'react';
import type { CropState } from '@/types/editor';

export function useEditorHistory() {
  const [undoStack, setUndoStack] = useState<CropState[]>([]);
  const [redoStack, setRedoStack] = useState<CropState[]>([]);

  const saveState = useCallback((state: CropState) => {
    setUndoStack((prev) => [...prev, state]);
    setRedoStack([]);
  }, []);

  const resetHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const undo = useCallback((current: CropState) => {
    if (!undoStack.length) return null;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [current, ...prev]);
    setUndoStack((prev) => prev.slice(0, -1));
    return previous;
  }, [undoStack]);

  const redo = useCallback((current: CropState) => {
    if (!redoStack.length) return null;
    const next = redoStack[0];
    setUndoStack((prev) => [...prev, current]);
    setRedoStack((prev) => prev.slice(1));
    return next;
  }, [redoStack]);

  return { undoStack, redoStack, saveState, resetHistory, undo, redo };
}
