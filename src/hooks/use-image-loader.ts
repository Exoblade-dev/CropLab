import { useCallback, useEffect, useRef, useState } from 'react';
import { loadImageFile } from '@/lib/image/loading';
import type { LoadedImage } from '@/types/editor';

export function useImageLoader(onError: (message: string) => void) {
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const loadRequestRef = useRef(0);

  const load = useCallback(async (file: File) => {
    const requestId = ++loadRequestRef.current;
    try {
      const next = await loadImageFile(file);
      if (requestId !== loadRequestRef.current) {
        URL.revokeObjectURL(next.src);
        return null;
      }

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = next.src;
      setLoadedImage(next);
      return next;
    } catch (error) {
      if (requestId === loadRequestRef.current) {
        onError(error instanceof Error ? error.message : 'Failed to load image');
      }
      return null;
    }
  }, [onError]);

  const clear = useCallback(() => {
    loadRequestRef.current += 1;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setLoadedImage(null);
  }, []);

  useEffect(() => () => {
    loadRequestRef.current += 1;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }, []);

  return { loadedImage, load, clear };
}
