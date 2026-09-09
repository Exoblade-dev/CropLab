import type { EditorHistoryEntry, EditorSnapshot } from '@/types/editor';

export const MAX_HISTORY_OPERATIONS = 50;

export function appendHistory(entries: EditorHistoryEntry[], currentIndex: number, snapshot: EditorSnapshot, label: string): { entries: EditorHistoryEntry[]; currentIndex: number } {
  const base = entries.slice(0, currentIndex + 1);
  const current = base[base.length - 1];
  if (current && JSON.stringify(current.snapshot) === JSON.stringify(snapshot)) return { entries, currentIndex };

  const next = [...base, { id: crypto.randomUUID(), label, snapshot }];
  const trimmed = next.length <= MAX_HISTORY_OPERATIONS + 1 ? next : [next[0], ...next.slice(-MAX_HISTORY_OPERATIONS)];
  return { entries: trimmed, currentIndex: trimmed.length - 1 };
}

export function moveHistory(entries: EditorHistoryEntry[], currentIndex: number, direction: -1 | 1): { entries: EditorHistoryEntry[]; currentIndex: number; snapshot: EditorSnapshot | null } {
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= entries.length) return { entries, currentIndex, snapshot: null };
  return { entries, currentIndex: nextIndex, snapshot: entries[nextIndex].snapshot };
}

export function selectHistory(entries: EditorHistoryEntry[], currentIndex: number, index: number): { entries: EditorHistoryEntry[]; currentIndex: number; snapshot: EditorSnapshot | null } {
  if (index < 0 || index >= entries.length || index === currentIndex) return { entries, currentIndex, snapshot: null };
  return { entries, currentIndex: index, snapshot: entries[index].snapshot };
}
