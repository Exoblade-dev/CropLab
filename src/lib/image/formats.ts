import type { ImageFormat } from '@/types/editor';

export type ExportFormatDefinition = {
  id: ImageFormat;
  label: string;
  mimeType: string;
  extension: string;
  supportsQuality: boolean;
  supportsTransparency: boolean;
  supportsBackground: boolean;
};

export const EXPORT_FORMATS: readonly ExportFormatDefinition[] = [
  {
    id: 'png',
    label: 'PNG',
    mimeType: 'image/png',
    extension: 'png',
    supportsQuality: false,
    supportsTransparency: true,
    supportsBackground: false,
  },
  {
    id: 'jpeg',
    label: 'JPEG',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    supportsQuality: true,
    supportsTransparency: false,
    supportsBackground: true,
  },
  {
    id: 'webp',
    label: 'WebP',
    mimeType: 'image/webp',
    extension: 'webp',
    supportsQuality: true,
    supportsTransparency: true,
    supportsBackground: false,
  },
];

export function getFormatDefinition(format: ImageFormat): ExportFormatDefinition {
  return EXPORT_FORMATS.find((item) => item.id === format) ?? EXPORT_FORMATS[0];
}

export function isFormatSupported(format: ImageFormat): boolean {
  if (typeof document === 'undefined') return true;
  const definition = getFormatDefinition(format);
  if (format === 'png') return true;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const dataUrl = canvas.toDataURL(definition.mimeType);
  return dataUrl.startsWith(`data:${definition.mimeType}`);
}

export function getSupportedExportFormats(): ExportFormatDefinition[] {
  return EXPORT_FORMATS.filter((format) => isFormatSupported(format.id));
}
