import { useCallback, useEffect, useRef, useState } from 'react';
import type { Area } from 'react-easy-crop';
import { createExportCanvas, encodeCanvas } from '@/lib/image/export';
import type { ExportSettings, ExportStatus, TransformState } from '@/types/editor';

type Params = {
  image: HTMLImageElement | null;
  crop: Area | null;
  transform: TransformState;
  settings: ExportSettings;
};

type Preview = {
  key: string;
  size: number | null;
  status: ExportStatus;
  error: string | null;
};

const PREVIEW_DEBOUNCE_MS = 1000;

export function useExportPreview({ image, crop, transform, settings }: Params) {
  const previewKey = image && crop
    ? [
        image.src,
        crop.x, crop.y, crop.width, crop.height,
        transform.rotation, transform.flipX, transform.flipY,
        settings.format, settings.quality, settings.width, settings.height,
        settings.lockAspectRatio, settings.backgroundColor,
      ].join('|')
    : '';

  const [preview, setPreview] = useState<Preview>({
    key: '',
    size: null,
    status: 'idle',
    error: null,
  });
  const activeKeyRef = useRef('');
  const blobRef = useRef<Blob | null>(null);
  const encodingKeyRef = useRef('');
  const encodingPromiseRef = useRef<Promise<Blob> | null>(null);

  useEffect(() => {
    activeKeyRef.current = previewKey;
    blobRef.current = null;
    encodingKeyRef.current = '';
    encodingPromiseRef.current = null;

    if (!image || !crop) return;

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        if (cancelled) return;

        setPreview((current) => ({ ...current, status: 'cropping', error: null }));
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        if (cancelled) return;

        setPreview((current) => ({ ...current, status: 'resizing', error: null }));
        const canvas = createExportCanvas(image, crop, transform, settings);
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        if (cancelled) return;

        setPreview((current) => ({ ...current, status: 'encoding', error: null }));
        const encodePromise = encodeCanvas(canvas, settings);
        encodingKeyRef.current = previewKey;
        encodingPromiseRef.current = encodePromise;
        const blob = await encodePromise;

        if (!cancelled && activeKeyRef.current === previewKey) {
          blobRef.current = blob;
          setPreview({ key: previewKey, size: blob.size, status: 'complete', error: null });
        }
      } catch (error) {
        if (!cancelled && activeKeyRef.current === previewKey) {
          setPreview({
            key: previewKey,
            size: null,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unable to estimate output size',
          });
        }
      } finally {
        if (encodingKeyRef.current === previewKey) {
          encodingKeyRef.current = '';
          encodingPromiseRef.current = null;
        }
      }
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [crop, image, previewKey, settings, transform]);

  const getBlob = useCallback((): Blob | null => {
    if (!previewKey || activeKeyRef.current !== previewKey) return null;
    return blobRef.current;
  }, [previewKey]);

  if (!image || !crop) return { key: '', size: null, status: 'idle' as ExportStatus, error: null, getBlob };
  if (preview.key !== previewKey) return { key: previewKey, size: null, status: 'preparing' as ExportStatus, error: null, getBlob };
  return { ...preview, getBlob };
}
