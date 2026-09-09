import { useCallback, useState } from 'react';
import { appendHistory, moveHistory, selectHistory } from '@/lib/editor/history';
import type { EditorHistoryEntry, EditorSnapshot } from '@/types/editor';

export function useEditorHistory(initialSnapshot: EditorSnapshot) {
  const [entries, setEntries] = useState<EditorHistoryEntry[]>(() => [{ id: 'original', label: 'Original', snapshot: initialSnapshot }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const record = useCallback((snapshot: EditorSnapshot, label: string) => {
    const next = appendHistory(entries, currentIndex, snapshot, label);
    if (next.entries === entries) return;
    setEntries(next.entries);
    setCurrentIndex(next.currentIndex);
  }, [currentIndex, entries]);

  const resetHistory = useCallback((snapshot: EditorSnapshot) => {
    setEntries([{ id: 'original', label: 'Original', snapshot }]);
    setCurrentIndex(0);
  }, []);

  const undo = useCallback(() => {
    const next = moveHistory(entries, currentIndex, -1);
    if (next.snapshot) setCurrentIndex(next.currentIndex);
    return next.snapshot;
  }, [currentIndex, entries]);

  const redo = useCallback(() => {
    const next = moveHistory(entries, currentIndex, 1);
    if (next.snapshot) setCurrentIndex(next.currentIndex);
    return next.snapshot;
  }, [currentIndex, entries]);

  const jumpTo = useCallback((index: number) => {
    const next = selectHistory(entries, currentIndex, index);
    if (next.snapshot) setCurrentIndex(next.currentIndex);
    return next.snapshot;
  }, [currentIndex, entries]);

  return {
    entries,
    currentIndex,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < entries.length - 1,
    record,
    resetHistory,
    undo,
    redo,
    jumpTo,
  };
}
