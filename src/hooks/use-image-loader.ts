import { useCallback, useRef, useState } from 'react';
import { loadImageFile } from '@/lib/image/loading';
import type { LoadedImage } from '@/types/editor';

export function useImageLoader(onError: (message: string) => void) {
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const load = useCallback(async (file: File) => {
    try {
      const next = await loadImageFile(file);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = next.src;
      setLoadedImage(next);
      return next;
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load image');
      return null;
    }
  }, [onError]);

  const clear = useCallback(() => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setLoadedImage(null);
  }, []);

  return { loadedImage, load, clear };
}
