import { validateCanvasDimensions, validateImageDimensions, validateImageFile, type InputImageFormat } from './validation';
import type { LoadedImage } from '@/types/editor';
import { getPreviewDimensions } from '@/lib/image/preview';
import { measureAsync, measureSync } from '@/lib/performance/metrics';

export async function loadImageFile(file: File): Promise<LoadedImage> {
  return measureAsync(
    'croplab.image.load',
    () => loadImageFileInternal(file),
    {
      fileBytes: file.size,
      fileType: file.type,
      fileName: file.name,
    },
  );
}

async function loadImageFileInternal(file: File): Promise<LoadedImage> {
  const validation = await validateImageFile(file);
  if (validation.valid === false) throw new Error(validation.message);

  const src = URL.createObjectURL(file);
  try {
    const element = await decodeImage(src);
    const dimensions = validateImageDimensions(element.naturalWidth, element.naturalHeight);
    if (dimensions.valid === false) throw new Error(dimensions.message);

    const format: InputImageFormat = validation.format ?? 'png';
    if (format === 'gif') {
      const staticImage = await measureAsync(
        'croplab.image.gif-first-frame',
        () => materializeGifFirstFrame(element),
        {
          width: element.naturalWidth,
          height: element.naturalHeight,
          pixels: element.naturalWidth * element.naturalHeight,
        },
      );

      URL.revokeObjectURL(src);
      return buildLoadedImage(staticImage.src, staticImage.element, file.size, format);
    }

    return buildLoadedImage(src, element, file.size, format);
  } catch (error) {
    URL.revokeObjectURL(src);
    throw error instanceof Error ? error : new Error('Failed to load image');
  }
}

async function buildLoadedImage(
  sourceSrc: string,
  element: HTMLImageElement,
  fileSize: number,
  format: InputImageFormat,
): Promise<LoadedImage> {
  const preview = await createPreviewSource(element);

  if (preview.src !== sourceSrc) {
    URL.revokeObjectURL(sourceSrc);
  }

  return {
    src: preview.src,
    element,
    fileSize,
    format,
    previewScaleX: preview.scaleX,
    previewScaleY: preview.scaleY,
    previewWidth: preview.width,
    previewHeight: preview.height,
  };
}

async function createPreviewSource(
  image: HTMLImageElement,
): Promise<{ src: string; width: number; height: number; scaleX: number; scaleY: number }> {
  const dimensions = getPreviewDimensions(image.naturalWidth, image.naturalHeight);

  if (dimensions.scaleX === 1 && dimensions.scaleY === 1) {
    return {
      src: image.src,
      width: image.naturalWidth,
      height: image.naturalHeight,
      scaleX: 1,
      scaleY: 1,
    };
  }

  return measureAsync(
    'croplab.image.preview',
    async () => {
      const bitmap = await createResizedBitmap(image, dimensions.width, dimensions.height);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Browser could not create a preview canvas');

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((next) => {
            if (next) resolve(next);
            else reject(new Error('Browser could not create an optimized image preview'));
          }, 'image/png');
        });

        return {
          src: URL.createObjectURL(blob),
          width: dimensions.width,
          height: dimensions.height,
          scaleX: dimensions.scaleX,
          scaleY: dimensions.scaleY,
        };
      } finally {
        bitmap.close();
      }
    },
    {
      sourceWidth: image.naturalWidth,
      sourceHeight: image.naturalHeight,
      previewWidth: dimensions.width,
      previewHeight: dimensions.height,
      sourcePixels: image.naturalWidth * image.naturalHeight,
      previewPixels: dimensions.width * dimensions.height,
    },
  ).catch(() => ({
    src: image.src,
    width: image.naturalWidth,
    height: image.naturalHeight,
    scaleX: 1,
    scaleY: 1,
  }));
}

async function createResizedBitmap(
  image: HTMLImageElement,
  width: number,
  height: number,
): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== 'function') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser could not create a preview canvas');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);
    return createImageBitmap(canvas);
  }

  return createImageBitmap(image, {
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: 'high',
  });
}

function decodeImage(src: string): Promise<HTMLImageElement> {
  return measureAsync('croplab.image.decode', () => new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      image.decode().then(() => resolve(image)).catch(() => reject(new Error('Failed to decode image. File may be corrupted.')));
    };
    image.onerror = () => reject(new Error('Failed to load image. File may be corrupted.'));
    image.src = src;
  }));
}

async function materializeGifFirstFrame(image: HTMLImageElement): Promise<{ src: string; element: HTMLImageElement }> {
  const validation = validateCanvasDimensions(image.naturalWidth, image.naturalHeight);
  if (validation.valid === false) throw new Error(validation.message);

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Browser could not create a canvas for the GIF first frame');

  measureSync(
    'croplab.image.gif-first-frame.draw',
    () => {
      context.drawImage(image, 0, 0);
    },
    {
      width: image.naturalWidth,
      height: image.naturalHeight,
      pixels: image.naturalWidth * image.naturalHeight,
    },
  );

  const blob = await measureAsync(
    'croplab.image.gif-first-frame.encode',
    () => new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((next) => {
        if (next) resolve(next);
        else reject(new Error('Browser could not create a static GIF frame'));
      }, 'image/png');
    }),
    {
      width: image.naturalWidth,
      height: image.naturalHeight,
      pixels: image.naturalWidth * image.naturalHeight,
    },
  );

  const src = URL.createObjectURL(blob);
  try {
    const element = await decodeImage(src);
    return { src, element };
  } catch (error) {
    URL.revokeObjectURL(src);
    throw error;
  }
}
