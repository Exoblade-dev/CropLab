import { validateCanvasDimensions, validateImageDimensions, validateImageFile, type InputImageFormat } from './validation';
import type { LoadedImage } from '@/types/editor';

export async function loadImageFile(file: File): Promise<LoadedImage> {
  const validation = await validateImageFile(file);
  if (validation.valid === false) throw new Error(validation.message);

  const src = URL.createObjectURL(file);
  try {
    const element = await decodeImage(src);
    const dimensions = validateImageDimensions(element.naturalWidth, element.naturalHeight);
    if (dimensions.valid === false) throw new Error(dimensions.message);

    const format: InputImageFormat = validation.format ?? 'png';
    if (format !== 'gif') return { src, element, fileSize: file.size, format };

    const staticImage = await materializeGifFirstFrame(element);
    URL.revokeObjectURL(src);
    return { src: staticImage.src, element: staticImage.element, fileSize: file.size, format };
  } catch (error) {
    URL.revokeObjectURL(src);
    throw error instanceof Error ? error : new Error('Failed to load image');
  }
}

function decodeImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      void image.decode().then(() => resolve(image)).catch(() => reject(new Error('Failed to decode image. File may be corrupted.')));
    };
    image.onerror = () => reject(new Error('Failed to load image. File may be corrupted.'));
    image.src = src;
  });
}

async function materializeGifFirstFrame(image: HTMLImageElement): Promise<{ src: string; element: HTMLImageElement }> {
  const validation = validateCanvasDimensions(image.naturalWidth, image.naturalHeight);
  if (validation.valid === false) throw new Error(validation.message);

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Browser could not create a canvas for the GIF first frame');

  context.drawImage(image, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => {
      if (next) resolve(next);
      else reject(new Error('Browser could not create a static GIF frame'));
    }, 'image/png');
  });

  const src = URL.createObjectURL(blob);
  try {
    const element = await decodeImage(src);
    return { src, element };
  } catch (error) {
    URL.revokeObjectURL(src);
    throw error;
  }
}
