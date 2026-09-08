import { validateImageDimensions, validateImageFile } from './validation';
import type { LoadedImage } from '@/types/editor';

export async function loadImageFile(file: File): Promise<LoadedImage> {
  const validation = validateImageFile(file); if (!validation.valid) throw new Error(validation.message);
  const src = URL.createObjectURL(file);
  try { const element = await decodeImage(src); const dimensions = validateImageDimensions(element.naturalWidth, element.naturalHeight); if (!dimensions.valid) throw new Error(dimensions.message); return { src, element, fileSize: file.size }; }
  catch (error) { URL.revokeObjectURL(src); throw error instanceof Error ? error : new Error('Failed to load image'); }
}
function decodeImage(src: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Failed to load image. File may be corrupted.')); image.src = src; }); }
