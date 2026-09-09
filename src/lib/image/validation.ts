import { MAX_FILE_SIZE, MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS } from './constants';

export type InputImageFormat = 'jpeg' | 'png' | 'webp' | 'gif';

export type ValidationResult = { valid: true; format?: InputImageFormat } | { valid: false; message: string };

const MIME_TO_FORMAT: Record<string, InputImageFormat> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const SUPPORTED_MIME_TYPES = new Set(Object.keys(MIME_TO_FORMAT));

function matchesBytes(bytes: Uint8Array, offset: number, signature: number[]): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

export function detectImageFormat(bytes: Uint8Array): InputImageFormat | null {
  if (bytes.length >= 3 && matchesBytes(bytes, 0, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (bytes.length >= 8 && matchesBytes(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (bytes.length >= 6 && (
    matchesBytes(bytes, 0, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    matchesBytes(bytes, 0, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  )) return 'gif';
  if (bytes.length >= 12 && matchesBytes(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && matchesBytes(bytes, 8, [0x57, 0x45, 0x42, 0x50])) return 'webp';
  return null;
}

export async function validateImageFile(file: File): Promise<ValidationResult> {
  if (file.size <= 0) return { valid: false, message: 'The selected file is empty' };
  if (file.size > MAX_FILE_SIZE) return { valid: false, message: 'Image is too large (max 50MB)' };

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const format = detectImageFormat(bytes);
  if (!format) return { valid: false, message: 'Unsupported or invalid image format. Use JPEG, PNG, WebP, or GIF.' };

  if (file.type && !SUPPORTED_MIME_TYPES.has(file.type)) {
    return { valid: false, message: 'Unsupported image type. Use JPEG, PNG, WebP, or GIF.' };
  }

  if (file.type && MIME_TO_FORMAT[file.type] !== format) {
    return { valid: false, message: 'The file type does not match the image data.' };
  }

  return { valid: true, format };
}

export function validateCanvasDimensions(width: number, height: number): ValidationResult {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { valid: false, message: 'Canvas dimensions are invalid' };
  }

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    return { valid: false, message: `Canvas dimensions are too large. Maximum supported dimension is ${MAX_IMAGE_DIMENSION}px.` };
  }

  const pixels = width * height;
  if (!Number.isSafeInteger(pixels) || pixels > MAX_IMAGE_PIXELS) {
    return { valid: false, message: `Canvas has too many pixels. Maximum supported canvas size is ${MAX_IMAGE_PIXELS.toLocaleString()} pixels.` };
  }

  return { valid: true };
}

export function validateImageDimensions(width: number, height: number): ValidationResult {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { valid: false, message: 'Image has invalid dimensions' };
  }

  const canvasValidation = validateCanvasDimensions(width, height);
  if (canvasValidation.valid === false) {
    return { valid: false, message: canvasValidation.message.replace('Canvas', 'Image').replace('canvas', 'image') };
  }

  return { valid: true };
}
