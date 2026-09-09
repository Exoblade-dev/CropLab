import { useCallback, useState } from 'react';
import type { EditorHistoryEntry, EditorSnapshot } from '@/types/editor';

const MAX_HISTORY = 50;

function trim(entries: EditorHistoryEntry[]): EditorHistoryEntry[] {
  return entries.length > MAX_HISTORY ? entries.slice(entries.length - MAX_HISTORY) : entries;
}

export function useEditorHistory() {
  const [undoStack, setUndoStack] = useState<EditorHistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<EditorHistoryEntry[]>([]);

  const saveState = useCallback((snapshot: EditorSnapshot, label: string) => {
    setUndoStack((prev) => trim([...prev, { id: crypto.randomUUID(), label, snapshot }]));
    setRedoStack([]);
  }, []);

  const resetHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const undo = useCallback((current: EditorSnapshot) => {
    if (!undoStack.length) return null;
    const entry = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [{ id: crypto.randomUUID(), label: entry.label, snapshot: current }, ...prev].slice(0, MAX_HISTORY));
    setUndoStack((prev) => prev.slice(0, -1));
    return entry.snapshot;
  }, [undoStack]);

  const redo = useCallback((current: EditorSnapshot) => {
    if (!redoStack.length) return null;
    const entry = redoStack[0];
    setUndoStack((prev) => trim([...prev, { id: crypto.randomUUID(), label: entry.label, snapshot: current }]));
    setRedoStack((prev) => prev.slice(1));
    return entry.snapshot;
  }, [redoStack]);

  return { undoStack, redoStack, saveState, resetHistory, undo, redo };
}
