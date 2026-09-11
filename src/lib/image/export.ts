import type { Area } from 'react-easy-crop';
import type { ExportSettings, ImageFormat, TransformState } from '@/types/editor';
import { getFormatDefinition } from '@/lib/image/formats';
import { validateCanvasDimensions } from '@/lib/image/validation';
import { measureAsync, measureSync } from '@/lib/performance/metrics';

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

export function getRotatedImageBounds(width: number, height: number, rotation: number) {
  const radians = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
    height: Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
  };
}

export function createExportCanvas(
  image: HTMLImageElement,
  crop: Area,
  transform: TransformState,
  settings: ExportSettings,
): HTMLCanvasElement {
  const { width, height } = getOutputDimensions(crop, settings);
  const canvasValidation = validateCanvasDimensions(width, height);
  if (!canvasValidation.valid) throw new Error(canvasValidation.message);

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

  const rotatedBounds = getRotatedImageBounds(image.naturalWidth, image.naturalHeight, transform.rotation);
  const outputScaleX = width / crop.width;
  const outputScaleY = height / crop.height;

  measureSync(
    'croplab.export.canvas-draw',
    () => {
      ctx.save();

      // croppedAreaPixels is expressed in the rotated image's bounding-box
      // coordinate space by react-easy-crop. Render that same coordinate
      // system directly into the output canvas instead of cropping the
      // unrotated source and rotating the result afterward.
      ctx.scale(outputScaleX, outputScaleY);
      ctx.translate(-crop.x, -crop.y);
      ctx.translate(rotatedBounds.width / 2, rotatedBounds.height / 2);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      if (transform.flipX) ctx.scale(-1, 1);
      if (transform.flipY) ctx.scale(1, -1);
      ctx.drawImage(
        image,
        -image.naturalWidth / 2,
        -image.naturalHeight / 2,
        image.naturalWidth,
        image.naturalHeight,
      );
      ctx.restore();
    },
    {
      format: settings.format,
      sourceWidth: image.naturalWidth,
      sourceHeight: image.naturalHeight,
      cropWidth: crop.width,
      cropHeight: crop.height,
      outputWidth: width,
      outputHeight: height,
      outputPixels: width * height,
      rotation: transform.rotation,
      flipX: transform.flipX,
      flipY: transform.flipY,
    },
  );

  return canvas;
}

export function encodeCanvas(canvas: HTMLCanvasElement, settings: ExportSettings): Promise<Blob> {
  const definition = getFormatDefinition(settings.format);
  return measureAsync(
    'croplab.export.encode',
    () => new Promise((resolve, reject) => {
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
    }),
    {
      format: settings.format,
      width: canvas.width,
      height: canvas.height,
      pixels: canvas.width * canvas.height,
      quality: definition.supportsQuality ? settings.quality : null,
    },
  );
}

export async function exportCanvasImage(
  image: HTMLImageElement,
  crop: Area,
  transform: TransformState,
  settings: ExportSettings,
): Promise<Blob> {
  return measureAsync(
    'croplab.export.total',
    async () => {
      const canvas = createExportCanvas(image, crop, transform, settings);
      return encodeCanvas(canvas, settings);
    },
    {
      format: settings.format,
      sourceWidth: image.naturalWidth,
      sourceHeight: image.naturalHeight,
      outputWidth: getOutputDimensions(crop, settings).width,
      outputHeight: getOutputDimensions(crop, settings).height,
    },
  );
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
