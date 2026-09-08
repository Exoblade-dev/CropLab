import type { Area } from 'react-easy-crop';
import type { ExportSettings, ImageFormat, TransformState } from '@/types/editor';
import { getFormatDefinition } from '@/lib/image/formats';

export function getOutputDimensions(crop: Area, settings: ExportSettings) {
  let width = crop.width;
  let height = crop.height;

  if (settings.width && settings.height) return { width: settings.width, height: settings.height };

  if (settings.width) {
    height = Math.max(1, Math.round(settings.width * (height / width)));
    width = settings.width;
  }

  if (settings.height) {
    width = Math.max(1, Math.round(settings.height * (width / height)));
    height = settings.height;
  }

  return { width, height };
}

export function getMimeType(format: ImageFormat): string {
  return getFormatDefinition(format).mimeType;
}

export function getFileExtension(format: ImageFormat): string {
  return getFormatDefinition(format).extension;
}

export function createExportCanvas(
  image: HTMLImageElement,
  crop: Area,
  transform: TransformState,
  settings: ExportSettings,
): HTMLCanvasElement {
  const { width, height } = getOutputDimensions(crop, settings);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (settings.format === 'jpeg') {
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  if (transform.flipX) ctx.scale(-1, 1);
  if (transform.flipY) ctx.scale(1, -1);
  ctx.translate(-width / 2, -height / 2);
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
  ctx.restore();

  return canvas;
}

export function encodeCanvas(canvas: HTMLCanvasElement, settings: ExportSettings): Promise<Blob> {
  const definition = getFormatDefinition(settings.format);
  return new Promise((resolve, reject) => {
    const callback = (blob: Blob | null) => {
      if (!blob) {
        reject(new Error(`Browser could not encode ${definition.label}`));
        return;
      }
      if (blob.type !== definition.mimeType) {
        reject(new Error(`${definition.label} encoding is not supported by this browser`));
        return;
      }
      resolve(blob);
    };

    if (definition.supportsQuality) {
      canvas.toBlob(callback, definition.mimeType, settings.quality);
    } else {
      canvas.toBlob(callback, definition.mimeType);
    }
  });
}

export async function exportCanvasImage(
  image: HTMLImageElement,
  crop: Area,
  transform: TransformState,
  settings: ExportSettings,
): Promise<Blob> {
  return encodeCanvas(createExportCanvas(image, crop, transform, settings), settings);
}

export function getSizeReductionPercent(originalSize: number, outputSize: number): number {
  if (originalSize <= 0) return 0;
  return Math.round((1 - outputSize / originalSize) * 100);
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 100 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 2 : 1)} MB`;
}
