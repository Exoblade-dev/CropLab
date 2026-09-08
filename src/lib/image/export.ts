import type { Area } from 'react-easy-crop';
import type { ExportSettings, ImageFormat, TransformState } from '@/types/editor';

export function getOutputDimensions(crop: Area, settings: ExportSettings) {
  let width = crop.width;
  let height = crop.height;
  if (settings.width && settings.height) return { width: settings.width, height: settings.height };
  if (settings.width) { height = Math.max(1, Math.round(settings.width * (height / width))); width = settings.width; }
  if (settings.height) { width = Math.max(1, Math.round(settings.height * (width / height))); height = settings.height; }
  return { width, height };
}
export function getMimeType(format: ImageFormat): string { return format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp'; }
export function getFileExtension(format: ImageFormat): string { return format; }
export function exportCanvasImage(image: HTMLImageElement, crop: Area, transform: TransformState, settings: ExportSettings): Promise<Blob> {
  const { width, height } = getOutputDimensions(crop, settings);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); if (!ctx) return Promise.reject(new Error('Could not get canvas context'));
  ctx.save(); ctx.translate(width / 2, height / 2); ctx.rotate((transform.rotation * Math.PI) / 180);
  if (transform.flipX) ctx.scale(-1, 1); if (transform.flipY) ctx.scale(1, -1);
  ctx.translate(-width / 2, -height / 2); ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height); ctx.restore();
  return new Promise((resolve, reject) => { canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed to create image')), getMimeType(settings.format), settings.quality); });
}
