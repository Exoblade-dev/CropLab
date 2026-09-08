import { useEffect, useState } from 'react';
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

export function useExportPreview({ image, crop, transform, settings }: Params): Preview {
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

  useEffect(() => {
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
        const blob = await encodeCanvas(canvas, settings);

        if (!cancelled) {
          setPreview({ key: previewKey, size: blob.size, status: 'complete', error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setPreview({
            key: previewKey,
            size: null,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unable to estimate output size',
          });
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [crop, image, previewKey, settings, transform]);

  if (!image || !crop) return { key: '', size: null, status: 'idle', error: null };
  if (preview.key !== previewKey) return { key: previewKey, size: null, status: 'preparing', error: null };
  return preview;
}
