'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorHistoryState, EditorSnapshot } from '@/types/editor';

export type ImageCollectionItem = {
  id: string;
  file: File;
  thumbnailUrl: string;
  history: EditorHistoryState;
};

function createId(): string {
  return crypto.randomUUID();
}

export function useImageCollection(initialSnapshot: EditorSnapshot) {
  const [items, setItems] = useState<ImageCollectionItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const itemsRef = useRef<ImageCollectionItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const addFiles = useCallback((files: File[]) => {
    const nextItems = files.map((file) => ({
      id: createId(),
      file,
      thumbnailUrl: URL.createObjectURL(file),
      history: {
        entries: [{ id: 'original', label: 'Original', snapshot: initialSnapshot }],
        currentIndex: 0,
      },
    }));

    const next = [...itemsRef.current, ...nextItems];
    itemsRef.current = next;
    setItems(next);
    return nextItems.map((item) => item.id);
  }, [initialSnapshot]);

  const replaceActiveFile = useCallback((file: File) => {
    let replacedId: string | null = null;
    const next = itemsRef.current.map((item) => {
      if (item.id !== activeId) return item;
      URL.revokeObjectURL(item.thumbnailUrl);
      replacedId = item.id;
      return {
        ...item,
        file,
        thumbnailUrl: URL.createObjectURL(file),
        history: {
          entries: [{ id: 'original', label: 'Original', snapshot: initialSnapshot }],
          currentIndex: 0,
        },
      };
    });
    itemsRef.current = next;
    setItems(next);
    return replacedId;
  }, [activeId, initialSnapshot]);

  const selectImage = useCallback((id: string) => {
    setActiveId((current) => current === id ? current : id);
  }, []);

  const updateActiveHistory = useCallback((history: EditorHistoryState) => {
    if (!activeId) return;
    const next = itemsRef.current.map((item) => item.id === activeId ? { ...item, history } : item);
    itemsRef.current = next;
    setItems(next);
  }, [activeId]);

  const removeImage = useCallback((id: string) => {
    const previous = itemsRef.current;
    const index = previous.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const next = previous.filter((item) => item.id !== id);
    const nextActiveId = next[Math.min(index, next.length - 1)]?.id ?? null;
    URL.revokeObjectURL(previous[index].thumbnailUrl);
    itemsRef.current = next;
    setItems(next);
    setActiveId((current) => current === id ? nextActiveId : current);
    return nextActiveId;
  }, []);

  const clearCollection = useCallback(() => {
    for (const item of itemsRef.current) URL.revokeObjectURL(item.thumbnailUrl);
    itemsRef.current = [];
    setItems([]);
    setActiveId(null);
  }, []);

  useEffect(() => () => {
    for (const item of itemsRef.current) URL.revokeObjectURL(item.thumbnailUrl);
    itemsRef.current = [];
  }, []);

  return {
    items,
    activeId,
    activeItem: items.find((item) => item.id === activeId) ?? null,
    addFiles,
    replaceActiveFile,
    selectImage,
    updateActiveHistory,
    removeImage,
    clearCollection,
  };
}
