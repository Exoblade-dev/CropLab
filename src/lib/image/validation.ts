import { MAX_FILE_SIZE } from './constants';

export type ValidationResult = { valid: true } | { valid: false; message: string };

export function validateImageFile(file: File): ValidationResult {
  if (!file.type.startsWith('image/')) return { valid: false, message: 'Please select an image file' };
  if (file.size > MAX_FILE_SIZE) return { valid: false, message: 'Image is too large (max 50MB)' };
  return { valid: true };
}

export function validateImageDimensions(width: number, height: number): ValidationResult {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { valid: false, message: 'Image has invalid dimensions' };
  }
  return { valid: true };
}
