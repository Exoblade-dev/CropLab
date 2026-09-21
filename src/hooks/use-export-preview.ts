import { useCallback, useEffect, useRef, useState } from 'react';
import type { Area } from 'react-easy-crop';
import { createExportCanvas, encodeCanvas, getInteractivePreviewSettings } from '@/lib/image/export';
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
  url: string | null;
};

const PREVIEW_DEBOUNCE_MS = 350;

export function useExportPreview({ image, crop, transform, settings }: Params) {
  const previewKey = image && crop
    ? [
        image.src,
        crop.x, crop.y, crop.width, crop.height,
        transform.rotation, transform.flipX, transform.flipY,
        settings.format, settings.quality, settings.width, settings.height,
        settings.lockAspectRatio, settings.backgroundColor,
        settings.adjustments.brightness, settings.adjustments.contrast, settings.adjustments.saturation,
        settings.adjustments.exposure, settings.adjustments.sharpen, settings.adjustments.blur,
      ].join('|')
    : '';

  const [preview, setPreview] = useState<Preview>({
    key: '',
    size: null,
    status: 'idle',
    error: null,
    url: null,
  });
  const activeKeyRef = useRef('');
  const blobRef = useRef<Blob | null>(null);
  const encodingKeyRef = useRef('');
  const encodingPromiseRef = useRef<Promise<Blob> | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const inspectionKeyRef = useRef('');
  const inspectionBlobRef = useRef<Blob | null>(null);
  const inspectionPromiseRef = useRef<Promise<Blob | null> | null>(null);

  useEffect(() => {
    activeKeyRef.current = previewKey;
    blobRef.current = null;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    encodingKeyRef.current = '';
    encodingPromiseRef.current = null;
    inspectionKeyRef.current = '';
    inspectionBlobRef.current = null;
    inspectionPromiseRef.current = null;

    if (!image || !crop) return;

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        if (cancelled) return;

        setPreview((current) => ({ ...current, status: 'cropping', error: null }));
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        if (cancelled) return;

        setPreview((current) => ({ ...current, status: 'resizing', error: null }));
        // Interactive preview must never run the full-resolution export pipeline.
        // In particular, sharpen is a per-pixel convolution and can otherwise
        // block the main thread for large source/output images.
        const previewSettings = getInteractivePreviewSettings(crop, settings);
        const canvas = createExportCanvas(image, crop, transform, previewSettings);
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        if (cancelled) return;

        setPreview((current) => ({ ...current, status: 'encoding', error: null }));
        const encodePromise = encodeCanvas(canvas, previewSettings);
        encodingKeyRef.current = previewKey;
        encodingPromiseRef.current = encodePromise;
        const blob = await encodePromise;

        if (!cancelled && activeKeyRef.current === previewKey) {
          blobRef.current = blob;
          const url = URL.createObjectURL(blob);
          previewUrlRef.current = url;
          setPreview({ key: previewKey, size: blob.size, status: 'complete', error: null, url });
        }
      } catch (error) {
        if (!cancelled && activeKeyRef.current === previewKey) {
          setPreview({
            key: previewKey,
            size: null,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unable to estimate output size',
            url: null,
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

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const getBlob = useCallback((): Blob | null => {
    if (!previewKey || activeKeyRef.current !== previewKey) return null;
    return blobRef.current;
  }, [previewKey]);

  const getInspectionBlob = useCallback(async (): Promise<Blob | null> => {
    if (!image || !crop || !previewKey || activeKeyRef.current !== previewKey) return null;

    if (inspectionKeyRef.current === previewKey && inspectionBlobRef.current) {
      return inspectionBlobRef.current;
    }

    if (inspectionKeyRef.current === previewKey && inspectionPromiseRef.current) {
      return inspectionPromiseRef.current;
    }

    inspectionKeyRef.current = previewKey;
    const promise = (async () => {
      try {
        const canvas = createExportCanvas(image, crop, transform, settings);
        const blob = await encodeCanvas(canvas, settings);
        if (activeKeyRef.current !== previewKey) return null;
        inspectionBlobRef.current = blob;
        return blob;
      } catch {
        return null;
      } finally {
        if (inspectionKeyRef.current === previewKey) {
          inspectionPromiseRef.current = null;
        }
      }
    })();

    inspectionPromiseRef.current = promise;
    return promise;
  }, [crop, image, previewKey, settings, transform]);

  if (!image || !crop) return { key: '', size: null, status: 'idle' as ExportStatus, error: null, url: null, getBlob, getInspectionBlob };
  if (preview.key !== previewKey) return { key: previewKey, size: null, status: 'preparing' as ExportStatus, error: null, url: null, getBlob, getInspectionBlob };
  return { ...preview, getBlob, getInspectionBlob };
}
